import React, { useState, useMemo, useRef } from 'react';
import { DocType, QboSyncItem, ReconciliationItem, WebDataItem } from '../types';
import { Language } from '../translations';
import { ToolboxIcon } from '../components/icons/ToolboxIcon';
import { Pagination } from '../components/Pagination';

interface DataReconciliationProps {
  language: Language;
}

/**
 * Parses a single line of a CSV string, respecting quoted fields.
 */
const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; 
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values.map(v => v.trim());
};


/**
 * Asynchronously parses CSV text data in chunks to prevent UI blocking.
 * @param text The raw CSV string.
 * @param type The type of data to parse ('web' or 'qbo').
 * @param onProgress Callback to report parsing progress (0-100).
 * @returns A Promise resolving to the structured data array.
 */
const parseCsvDataAsync = (
    text: string,
    type: 'web' | 'qbo',
    onProgress: (percentage: number) => void
): Promise<WebDataItem[] | QboSyncItem[]> => {
    return new Promise((resolve, reject) => {
        try {
            const rowsRegex = /(?:"(?:[^"]|"")*"|[^,"]*)*?(?:\r\n|\n|\r|$)/g;
            const lines = text.trim().match(rowsRegex)?.filter(line => line.trim()) ?? [];

            if (lines.length < 2) {
                return reject(new Error("CSV文件必须包含表头和至少一行数据。"));
            }

            const headers = parseCsvLine(lines[0]).map(h => h.trim().replace(/"/g, '').replace(/\s+/g, '').toLowerCase());
            const data: any[] = [];
            let currentIndex = 1;
            const totalRows = lines.length - 1;
            const chunkSize = 1000; // Process 1000 rows per chunk

            const processChunk = () => {
                const limit = Math.min(currentIndex + chunkSize, lines.length);
                for (let i = currentIndex; i < limit; i++) {
                    if (!lines[i]) continue;
                    const values = parseCsvLine(lines[i]);
                    if (values.length !== headers.length && values.length > 0) {
                        console.warn(`Skipping malformed row ${i + 1}: expected ${headers.length} values, found ${values.length}.`);
                        continue;
                    }
                    const entry: { [key: string]: any } = {};
                    headers.forEach((header, index) => {
                        entry[header] = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
                    });
                    data.push(entry);
                }
                currentIndex = limit;
                
                onProgress(Math.round(((currentIndex - 1) / totalRows) * 100));

                if (currentIndex < lines.length) {
                    setTimeout(processChunk, 0); // Yield to main thread
                } else {
                    // Map to final types after all chunks are processed
                    if (type === 'web') {
                        resolve(data.map((row: any): WebDataItem => ({
                            docNumber: row.docnumber || '',
                            sku: row.sku || '',
                            productName: row.productname || '',
                            qty: Number(row.qty) || 0,
                        })));
                    } else { // 'qbo'
                        resolve(data.map((row: any, index: number): QboSyncItem => ({
                            id: `csv-${index}-${Date.now()}`,
                            date: row.date || '',
                            type: row.type as DocType || 'Invoice',
                            docNumber: row.docnumber || '',
                            customer: row.customer || '',
                            sku: row.sku || '',
                            product: row.product || '',
                            description: row.description || '',
                            qty: Number(row.qty) || 0,
                            shippingTo: row.shippingto || '',
                        })));
                    }
                }
            };
            processChunk();
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Asynchronously creates a Map from an array of WebDataItem in chunks.
 */
const createMapAsync = (
    data: WebDataItem[],
    onProgress: (percentage: number) => void
): Promise<Map<string, WebDataItem>> => {
    return new Promise((resolve) => {
        const map = new Map<string, WebDataItem>();
        if (data.length === 0) {
            return resolve(map);
        }
        let currentIndex = 0;
        const total = data.length;
        const chunkSize = 10000;

        const processChunk = () => {
            const limit = Math.min(currentIndex + chunkSize, total);
            for (let i = currentIndex; i < limit; i++) {
                const item = data[i];
                if (item && item.sku) {
                    map.set(item.sku.toLowerCase(), item);
                }
            }
            currentIndex = limit;
            
            onProgress(Math.round((currentIndex / total) * 100));

            if (currentIndex < total) {
                setTimeout(processChunk, 0);
            } else {
                resolve(map);
            }
        };
        processChunk();
    });
};


const DataReconciliation: React.FC<DataReconciliationProps> = ({ language }) => {
  const [rawWebData, setRawWebData] = useState<string | null>(null);
  const [rawQboData, setRawQboData] = useState<string | null>(null);
  const [webFileName, setWebFileName] = useState<string | null>(null);
  const [qboFileName, setQboFileName] = useState<string | null>(null);
  const [reconciledData, setReconciledData] = useState<ReconciliationItem[]>([]);
  const [isFileLoading, setIsFileLoading] = useState<'web' | 'qbo' | false>(false);
  const [progress, setProgress] = useState({ step: 'idle', percentage: 0 }); // idle, parsing_web, parsing_qbo, building_map, integrating, done
  const [notification, setNotification] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const webFileRef = useRef<HTMLInputElement>(null);
  const qboFileRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'web' | 'qbo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsFileLoading(type);
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (type === 'web') {
            setRawWebData(text);
            setWebFileName(file.name);
            showNotification(`WEB 文件已加载: ${file.name}`);
        } else {
            setRawQboData(text);
            setQboFileName(file.name);
            showNotification(`QBO 文件已加载: ${file.name}`);
        }
        setIsFileLoading(false);
    };
    reader.onerror = () => {
        alert("读取文件时出错。");
        setIsFileLoading(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleIntegrate = async () => {
    if (!rawWebData || !rawQboData) {
        alert('请在整合前导入WEB和QBO两个文件。');
        return;
    }
    setCurrentPage(1);
    setReconciledData([]);

    try {
        // Step 1: Parse WEB data asynchronously
        const parsedWebData = await parseCsvDataAsync(
            rawWebData, 'web', (p) => setProgress({ step: 'parsing_web', percentage: p })
        ) as WebDataItem[];

        // Step 2: Parse QBO data asynchronously
        const parsedQboData = await parseCsvDataAsync(
            rawQboData, 'qbo', (p) => setProgress({ step: 'parsing_qbo', percentage: p })
        ) as QboSyncItem[];
        
        // Step 3: Build WEB data map for efficient lookup, asynchronously
        const webMap = await createMapAsync(
            parsedWebData, (p) => setProgress({ step: 'building_map', percentage: p })
        );

        // Step 4: Integrate data asynchronously
        const integrationPromise = new Promise<ReconciliationItem[]>((resolve) => {
            let currentIndex = 0;
            const chunkSize = 500;
            const results: ReconciliationItem[] = [];
            const totalRecords = parsedQboData.length;

            if (totalRecords === 0) {
                return resolve([]);
            }

            const processChunk = () => {
                const limit = Math.min(currentIndex + chunkSize, totalRecords);
                for (let i = currentIndex; i < limit; i++) {
                    const qboItem = parsedQboData[i];
                    if (!qboItem || !qboItem.sku) continue;
                    
                    const webItem = webMap.get(qboItem.sku.toLowerCase());

                    if (webItem) {
                        let qboProductName = qboItem.product;
                        const parts = qboProductName.split(':');
                        if (parts.length > 1) {
                            qboProductName = parts.slice(1).join(':').trim();
                        }

                        results.push({
                            sku: qboItem.sku,
                            webName: webItem.productName,
                            qboName: qboProductName,
                            qboDescription: qboItem.description,
                        });
                    }
                }
                currentIndex = limit;
                setProgress({ step: 'integrating', percentage: Math.round((currentIndex / totalRecords) * 100) });

                if (currentIndex < totalRecords) {
                    setTimeout(processChunk, 0);
                } else {
                    resolve(results);
                }
            };
            processChunk();
        });

        const finalResults = await integrationPromise;
        setReconciledData(finalResults);
        showNotification(`数据整合完成！找到 ${finalResults.length} 条匹配项。`);
        setProgress({ step: 'done', percentage: 100 });

    } catch (error) {
        console.error("Error during integration:", error);
        alert(`处理数据时出错: ${(error as Error).message}`);
        setProgress({ step: 'idle', percentage: 0 });
    }
  };


  const handleExport = () => {
    if (reconciledData.length === 0) {
        alert("没有可导出的数据。");
        return;
    }
    const escapeCsvField = (field: any): string => {
        const strField = String(field ?? '');
        if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
            return `"${strField.replace(/"/g, '""')}"`;
        }
        return strField;
    };
    const headers = Object.keys(reconciledData[0]);
    const csvRows = [headers.join(',')];
    for (const row of reconciledData) {
        const values = headers.map(header => escapeCsvField((row as any)[header]));
        csvRows.push(values.join(','));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('download', `reconciliation_export_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reconciledData.slice(startIndex, startIndex + itemsPerPage);
  }, [reconciledData, currentPage]);
  
  const totalPages = Math.ceil(reconciledData.length / itemsPerPage);
  
  const isProcessing = progress.step !== 'idle' && progress.step !== 'done';

  const getButtonText = () => {
    switch (progress.step) {
        case 'parsing_web': return `解析WEB... (${progress.percentage}%)`;
        case 'parsing_qbo': return `解析QBO... (${progress.percentage}%)`;
        case 'building_map': return `构建索引... (${progress.percentage}%)`;
        case 'integrating': return `整合中... (${progress.percentage}%)`;
        case 'done': return '数据整合';
        default: return '数据整合';
    }
  };

  return (
    <>
      <input type="file" ref={webFileRef} onChange={(e) => handleFileSelect(e, 'web')} className="hidden" accept=".csv" />
      <input type="file" ref={qboFileRef} onChange={(e) => handleFileSelect(e, 'qbo')} className="hidden" accept=".csv" />
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <ToolboxIcon className="h-7 w-7 text-sky-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                数据整合
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => webFileRef.current?.click()} disabled={isProcessing || !!isFileLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed">
                        {isFileLoading === 'web' ? '导入中...' : '选择WEB文件'}
                    </button>
                    {webFileName && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full px-1" title={webFileName}>{webFileName}</p>}
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button onClick={() => qboFileRef.current?.click()} disabled={isProcessing || !!isFileLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed">
                        {isFileLoading === 'qbo' ? '导入中...' : '选择QBO文件'}
                    </button>
                    {qboFileName && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full px-1" title={qboFileName}>{qboFileName}</p>}
                </div>
                <button onClick={handleIntegrate} disabled={isProcessing || !!isFileLoading || !rawWebData || !rawQboData} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed self-center">
                    {getButtonText()}
                </button>
                <button onClick={handleExport} disabled={isProcessing || !!isFileLoading || reconciledData.length === 0} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 self-center">
                    导出结果
                </button>
                {isProcessing && (
                    <div className="md:col-span-4 mt-2">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                            <div 
                                className="bg-sky-600 h-2.5 rounded-full" 
                                style={{ width: `${progress.percentage}%`, transition: 'width 0.3s ease-in-out' }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {notification && (
          <div className="fixed top-20 right-8 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg z-50 animate-pulse">
            <p>{notification}</p>
          </div>
        )}
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">整合结果 <span className="text-sm text-slate-500">({reconciledData.length} 条匹配)</span></h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">SKU</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">WEB Name</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">QBO Name</th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">QBO Description</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {isProcessing ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                                    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                                    <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64"></div></td>
                                </tr>
                            ))
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <tr key={`${item.sku}-${index}`}>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{item.webName}</td>
                                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{item.qboName}</td>
                                    <td className="px-3 sm:px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell truncate max-w-sm" title={item.qboDescription}>{item.qboDescription}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-12 px-6">
                                    <p className="text-slate-500 dark:text-slate-400">
                                        {reconciledData.length > 0 ? 'No results on this page.' : 'No reconciled data yet. Import files and click "数据整合".'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsCount={reconciledData.length}
                        itemsPerPage={itemsPerPage}
                    />
                </div>
            )}
        </div>
      </main>
    </>
  );
};

export default DataReconciliation;