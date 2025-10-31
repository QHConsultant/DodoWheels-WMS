import React, { useState, useMemo, useRef } from 'react';
import { DocType, QboSyncItem, ReconciliationItem, WebDataItem } from '../types';
import { Language } from '../translations';
import { ToolboxIcon } from '../components/icons/ToolboxIcon';
import { Pagination } from '../components/Pagination';

declare var XLSX: any;

interface DataReconciliationProps {
  language: Language;
}

interface FileSummary {
    fileName: string;
    rowCount: number;
    headers: string[];
    previewData: { [key: string]: any }[];
}

const findValueByAliases = (row: { [key: string]: any }, aliases: string[]): any => {
    for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== null) {
            return row[alias];
        }
    }
    return '';
};


const parseExcelFileAsync = (file: File, type: 'web' | 'qbo', onProgress: (percentage: number) => void): Promise<{ data: WebDataItem[] | QboSyncItem[], summary: FileSummary }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded * 100) / event.total);
                onProgress(percentage);
            }
        };

        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target?.result;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    return reject(new Error("Excel file contains no sheets."));
                }
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    return reject(new Error("The first sheet of the Excel file is empty."));
                }

                const headers = Object.keys(jsonData[0]);
                const summary: FileSummary = {
                    fileName: file.name,
                    rowCount: jsonData.length,
                    headers,
                    previewData: jsonData.slice(0, 5),
                };

                const normalizedJsonData = jsonData.map(row => {
                    const newRow: { [key: string]: any } = {};
                    for (const key in row) {
                        const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
                        newRow[normalizedKey] = row[key];
                    }
                    return newRow;
                });

                let mappedData;
                if (type === 'web') {
                    const skuAliases = ['sku', 'item', 'productsku', 'itemcode', 'productid'];
                    const docNumAliases = ['docnumber', 'no', 'documentno', 'invoiceno', 'salesorderno'];
                    const productNameAliases = ['productname', 'name', 'itemname', 'description'];
                    const qtyAliases = ['qty', 'quantity'];

                    mappedData = normalizedJsonData.map((row): WebDataItem => {
                        const rawSku = findValueByAliases(row, skuAliases);
                        return {
                            docNumber: String(findValueByAliases(row, docNumAliases)),
                            sku: (String(rawSku) || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''),
                            productName: String(findValueByAliases(row, productNameAliases)),
                            qty: Number(findValueByAliases(row, qtyAliases)) || 0,
                        };
                    });
                } else { // 'qbo'
                    const qboSkuAliases = ['sku', 'item', 'productsku', 'itemcode', 'productid', 'product'];
                    const qboDocNumAliases = ['docnumber', 'no', 'documentno', 'num'];
                    const qboCustomerAliases = ['customer', 'client', 'billtoname', 'name'];
                    const qboProductAliases = ['productservicename', 'productservice', 'product', 'item'];
                    const qboDescAliases = ['salesdescription', 'description', 'memo'];
                    const qboQtyAliases = ['qty', 'quantity'];
                    const qboDateAliases = ['date'];
                    const qboTypeAliases = ['type', 'transactiontype'];
                    const qboShippingAliases = ['shippingto', 'shipto'];
                    
                    mappedData = normalizedJsonData.map((row, index): QboSyncItem => {
                        const rawSku = findValueByAliases(row, qboSkuAliases);
                        return {
                            id: `csv-${index}-${Date.now()}`,
                            date: String(findValueByAliases(row, qboDateAliases)),
                            type: (findValueByAliases(row, qboTypeAliases) as DocType) || 'Invoice',
                            docNumber: String(findValueByAliases(row, qboDocNumAliases)),
                            customer: String(findValueByAliases(row, qboCustomerAliases)),
                            sku: (String(rawSku) || '').toUpperCase().replace(/[^A-Z0-9-]/g, ''),
                            product: String(findValueByAliases(row, qboProductAliases)),
                            description: String(findValueByAliases(row, qboDescAliases)),
                            qty: Number(findValueByAliases(row, qboQtyAliases)) || 0,
                            shippingTo: String(findValueByAliases(row, qboShippingAliases)),
                        };
                    });
                }
                resolve({ data: mappedData as any, summary });

            } catch (err) {
                console.error("Error parsing Excel file:", err);
                reject(new Error(`Failed to process Excel file. Please ensure it's a valid .xlsx or .xls file. Error: ${(err as Error).message}`));
            }
        };
        reader.onerror = (err) => reject(new Error("Error reading file."));
        reader.readAsArrayBuffer(file);
    });
};

const createMapAsync = (data: WebDataItem[], onProgress: (percentage: number) => void): Promise<Map<string, WebDataItem>> => {
    return new Promise((resolve) => {
        const map = new Map<string, WebDataItem>();
        if (data.length === 0) return resolve(map);
        let currentIndex = 0;
        const total = data.length;
        const chunkSize = 10000;
        const processChunk = () => {
            const limit = Math.min(currentIndex + chunkSize, total);
            for (let i = currentIndex; i < limit; i++) {
                const item = data[i];
                const cleanSku = item?.sku || '';
                if (cleanSku) map.set(cleanSku, item);
            }
            currentIndex = limit;
            onProgress(Math.round((currentIndex / total) * 100));
            if (currentIndex < total) setTimeout(processChunk, 0);
            else resolve(map);
        };
        processChunk();
    });
};

const FilePreviewCard: React.FC<{ summary: FileSummary | null, type: 'WEB' | 'QBO', isLoading: boolean }> = ({ summary, type, isLoading }) => {
    if (isLoading) {
        return <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-pulse h-60"></div>;
    }
    if (!summary) {
        return (
            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center h-60 flex flex-col justify-center">
                <p className="text-slate-500 dark:text-slate-400">请上传 {type} 文件</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">上传后将在此处显示预览</p>
            </div>
        );
    }
    return (
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg h-60 flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate" title={summary.fileName}>{summary.fileName}</h3>
            <div className="flex gap-x-4 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>行数: {summary.rowCount}</span>
            </div>
            <div className="overflow-auto text-xs flex-grow">
                <table className="w-full">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700">
                        <tr>
                            {summary.headers.map(h => <th key={h} className="p-1 border-b border-slate-200 dark:border-slate-600 font-medium text-left truncate">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {summary.previewData.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                {summary.headers.map(h => <td key={h} className="p-1 border-b border-slate-200 dark:border-slate-600 truncate" title={String(row[h])}>{String(row[h])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DataReconciliation: React.FC<DataReconciliationProps> = ({ language }) => {
  const [webData, setWebData] = useState<WebDataItem[] | null>(null);
  const [qboData, setQboData] = useState<QboSyncItem[] | null>(null);
  const [webFileSummary, setWebFileSummary] = useState<FileSummary | null>(null);
  const [qboFileSummary, setQboFileSummary] = useState<FileSummary | null>(null);
  const [reconciledData, setReconciledData] = useState<ReconciliationItem[]>([]);
  const [isFileLoading, setIsFileLoading] = useState<'web' | 'qbo' | false>(false);
  const [progress, setProgress] = useState({ step: 'idle', percentage: 0 });
  const [notification, setNotification] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const webFileRef = useRef<HTMLInputElement>(null);
  const qboFileRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, isError = false) => {
    setNotification(message);
    setTimeout(() => setNotification(null), isError ? 5000 : 3000);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'web' | 'qbo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsFileLoading(type);
    setProgress({ step: `loading_${type}`, percentage: 0 });
    try {
        const { data, summary } = await parseExcelFileAsync(file, type, (p) => setProgress({ step: `loading_${type}`, percentage: p }));
        if (type === 'web') {
            setWebData(data as WebDataItem[]);
            setWebFileSummary(summary);
        } else {
            setQboData(data as QboSyncItem[]);
            setQboFileSummary(summary);
        }
        showNotification(`${type.toUpperCase()} 文件已加载: ${file.name}`);
    } catch (err) {
        alert(`解析文件失败: ${(err as Error).message}`);
        if (type === 'web') { setWebFileSummary(null); setWebData(null); } 
        else { setQboFileSummary(null); setQboData(null); }
    } finally {
        setIsFileLoading(false);
        setProgress({ step: 'idle', percentage: 0 });
        event.target.value = '';
    }
  };

  const handleIntegrate = async () => {
    if (!webData || !qboData) {
        alert('请在整合前导入WEB和QBO两个文件。');
        return;
    }
    setCurrentPage(1);
    setReconciledData([]);

    try {
        const webMap = await createMapAsync(webData, (p) => setProgress({ step: 'building_map', percentage: p }));
        
        const integrationPromise = new Promise<ReconciliationItem[]>((resolve) => {
            let currentIndex = 0;
            const chunkSize = 500;
            const results: ReconciliationItem[] = [];
            const totalRecords = qboData.length;
            if (totalRecords === 0) return resolve([]);
            
            const processChunk = () => {
                const limit = Math.min(currentIndex + chunkSize, totalRecords);
                for (let i = currentIndex; i < limit; i++) {
                    const qboItem = qboData[i];
                    const cleanQboSku = qboItem?.sku || '';
                    if (!cleanQboSku) continue;
                    const webItem = webMap.get(cleanQboSku);
                    if (webItem) {
                      const fullQboName = qboItem.product || '';
                      const nameParts = fullQboName.split(':');
                      const finalQboName = nameParts.length > 1 ? nameParts.slice(1).join(':').trim() : fullQboName;
                      
                      results.push({
                          sku: qboItem.sku,
                          webName: webItem.productName,
                          qboName: finalQboName,
                          qboDescription: qboItem.description, // Correctly maps to Sales Description
                      });
                    }
                }
                currentIndex = limit;
                setProgress({ step: 'integrating', percentage: Math.round((currentIndex / totalRecords) * 100) });
                if (currentIndex < totalRecords) setTimeout(processChunk, 0);
                else resolve(results);
            };
            processChunk();
        });
        
        const finalResults = await integrationPromise;
        setReconciledData(finalResults);
        showNotification(`数据整合完成！共找到 ${finalResults.length} 条匹配记录。`);
        setProgress({ step: 'done', percentage: 100 });
    } catch (error) {
        console.error("Error during integration:", error);
        alert(`处理数据时出错: ${(error as Error).message}`);
        setProgress({ step: 'idle', percentage: 0 });
    }
  };

  const handleExport = () => {
    if (reconciledData.length === 0) return alert("没有可导出的数据。");
    const worksheet = XLSX.utils.json_to_sheet(reconciledData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reconciliation");
    XLSX.writeFile(workbook, `reconciliation_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reconciledData.slice(startIndex, startIndex + itemsPerPage);
  }, [reconciledData, currentPage]);
  
  const totalPages = Math.ceil(reconciledData.length / itemsPerPage);
  const isProcessing = progress.step !== 'idle' && progress.step !== 'done';
  const getButtonText = (step: string, p: number) => {
    switch (step) {
        case 'loading_web': return `导入WEB... (${p}%)`;
        case 'loading_qbo': return `导入QBO... (${p}%)`;
        case 'building_map': return `构建索引... (${p}%)`;
        case 'integrating': return `整合中... (${p}%)`;
        default: return '数据整合';
    }
  };

  return (
    <>
      <input type="file" ref={webFileRef} onChange={(e) => handleFileSelect(e, 'web')} className="hidden" accept=".xlsx, .xls" />
      <input type="file" ref={qboFileRef} onChange={(e) => handleFileSelect(e, 'qbo')} className="hidden" accept=".xlsx, .xls" />
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3"><ToolboxIcon className="h-7 w-7 text-sky-500" /><h1 className="text-xl font-bold text-slate-900 dark:text-white">数据整合</h1></div>
        </div></div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-6">
                <button onClick={() => webFileRef.current?.click()} disabled={isProcessing || !!isFileLoading} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed">
                    {isFileLoading === 'web' ? '导入中...' : '1. 选择WEB文件'}
                </button>
                <button onClick={() => qboFileRef.current?.click()} disabled={isProcessing || !!isFileLoading} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed">
                    {isFileLoading === 'qbo' ? '导入中...' : '2. 选择QBO文件'}
                </button>
                <button onClick={handleIntegrate} disabled={isProcessing || !!isFileLoading || !webData || !qboData} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed">
                    {getButtonText(progress.step, progress.percentage)}
                </button>
                <button onClick={handleExport} disabled={isProcessing || !!isFileLoading || reconciledData.length === 0} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                    4. 导出结果(Excel)
                </button>
                {isProcessing && <div className="md:col-span-4 mt-2"><div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700"><div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%`, transition: 'width 0.3s ease-in-out' }}></div></div></div>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FilePreviewCard summary={webFileSummary} type="WEB" isLoading={isFileLoading === 'web'} />
                <FilePreviewCard summary={qboFileSummary} type="QBO" isLoading={isFileLoading === 'qbo'} />
            </div>
        </div>

        {notification && <div className="fixed top-20 right-8 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg z-50"><p>{notification}</p></div>}
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 sm:p-6"><h2 className="text-lg font-semibold text-slate-900 dark:text-white">整合结果 <span className="text-sm text-slate-500">({reconciledData.length} 条记录)</span></h2></div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50"><tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">SKU</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">WEB Name</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">QBO Name</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">QBO Description</th>
                    </tr></thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        {paginatedData.map((item, index) => (
                            <tr key={`${item.sku}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-slate-800 dark:text-slate-200">{item.webName}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-slate-800 dark:text-slate-200">{item.qboName}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden md:table-cell">{item.qboDescription}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {reconciledData.length === 0 && !isProcessing && <div className="text-center py-12 text-slate-500">没有匹配的数据或尚未开始整合。</div>}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsCount={reconciledData.length}
                itemsPerPage={itemsPerPage}
            />
        </div>
      </main>
    </>
  );
};

export default DataReconciliation;