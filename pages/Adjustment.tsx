import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { fetchAdjustments, updateAdjustment, exportAdjustmentsAndMarkAsExported } from '../services/adjustmentService';
import { Language, translations } from '../translations';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { AdjustmentTableRow } from '../components/AdjustmentTableRow';
import { ArrowDownTrayIcon } from '../components/icons/ArrowDownTrayIcon';

interface AdjustmentProps {
  language: Language;
}

const Adjustment: React.FC<AdjustmentProps> = ({ language }) => {
  const [adjustments, setAdjustments] = useState<AdjustmentLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | 'All'>('All');
  const [ynFilter, setYnFilter] = useState<'All' | 'YES' | 'NO'>('All');
  const [isExporting, setIsExporting] = useState(false);


  const t = translations[language].adjustment;

  const loadAdjustments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdjustments();
      setAdjustments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch adjustments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);
  
  const handleUpdate = async (updatedItem: AdjustmentLineItem) => {
    try {
        await updateAdjustment(updatedItem);
        // After any successful update (edit or copy-save), reload all data to reflect changes
        await loadAdjustments();
    } catch (err) {
        console.error('[Page] handleUpdate: Failed to update item.', { id: updatedItem.id, error: err });
        alert(`Failed to update item: ${(err as Error).message}`);
    }
  };

  const handleCopy = (itemToCopy: AdjustmentLineItem) => {
    const newItem: AdjustmentLineItem = {
      ...itemToCopy,
      id: `new-${Date.now()}`,
      originalId: itemToCopy.id,
      status: AdjustmentStatus.Unconfirmed,
      selectedLocation: undefined,
      isNew: true, // Flag to auto-open in edit mode
      yn: 'N/A',
    };
    const index = adjustments.findIndex(adj => adj.id === itemToCopy.id);
    const newAdjustments = [...adjustments];
    newAdjustments.splice(index + 1, 0, newItem);
    setAdjustments(newAdjustments);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const dataToExport = await exportAdjustmentsAndMarkAsExported();

        if (dataToExport && dataToExport.length > 0) {
            const escapeCsvField = (field: any): string => {
                const strField = String(field ?? '');
                if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
                    return `"${strField.replace(/"/g, '""')}"`;
                }
                return strField;
            };
            
            const headers = Object.keys(dataToExport[0]);
            const csvRows = [headers.join(',')];

            for (const row of dataToExport) {
                const values = headers.map(header => escapeCsvField((row as any)[header]));
                csvRows.push(values.join(','));
            }
            
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            link.setAttribute('download', `adjustments_export_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await loadAdjustments();
        } else {
            alert("No new adjustments to export.");
        }
    } catch (err) {
        console.error("Export failed:", err);
        alert(`Failed to export adjustments: ${(err as Error).message}`);
    } finally {
        setIsExporting(false);
    }
  };


  const filteredAdjustments = useMemo(() => {
    return adjustments
      .filter(item => {
        if (statusFilter === 'All') return true;
        return item.status === statusFilter;
      })
      .filter(item => {
        if (ynFilter === 'All' || item.yn === 'N/A') return true;
        return item.yn === ynFilter;
      })
      .filter(item =>
        (item.docNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [adjustments, searchTerm, statusFilter, ynFilter]);

  const renderContent = () => {
    if (error) {
      return <div className="text-center py-20"><p className="text-red-500">{String(error)}</p></div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">{t.tableHeaders.date}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.docNumber}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.tableHeaders.customer}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.sku}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">{t.tableHeaders.product}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.qty}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.locations}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.status}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.imported}</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.action}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 sm:px-6 py-4 hidden lg:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                      <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                      <td className="px-3 sm:px-6 py-4 hidden sm:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div></td>
                      <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                      <td className="px-3 sm:px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div></td>
                      <td className="px-3 sm:px-6 py-4 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8 mx-auto"></div></td>
                      <td className="px-3 sm:px-6 py-4"><div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                      <td className="px-3 sm:px-6 py-4 text-center"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24 mx-auto"></div></td>
                      <td className="px-3 sm:px-6 py-4 text-center"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20 mx-auto"></div></td>
                      <td className="px-3 sm:px-6 py-4 text-center"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20 mx-auto"></div></td>
                    </tr>
                  ))
                ) : filteredAdjustments.length > 0 ? (
                    filteredAdjustments.map((item) => (
                        <AdjustmentTableRow
                            key={item.id}
                            item={item}
                            onUpdate={handleUpdate}
                            onCopy={handleCopy}
                            language={language}
                        />
                    ))
                ) : (
                    <tr>
                        <td colSpan={10} className="text-center py-12 px-6">
                            <p className="text-slate-500 dark:text-slate-400">{t.noAdjustments}</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    );
  };
  
  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-3 sm:h-20 sm:py-0 gap-4">
            <div className="flex items-center space-x-3">
              <SwitchHorizontalIcon className="h-7 w-7 text-sky-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.title}
              </h1>
            </div>
             <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full sm:w-auto px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="All">{t.status.all}</option>
                    <option value={AdjustmentStatus.Unconfirmed}>{t.status.unconfirmed}</option>
                    <option value={AdjustmentStatus.Confirmed}>{t.status.confirmed}</option>
                </select>
                <select
                    value={ynFilter}
                    onChange={(e) => setYnFilter(e.target.value as any)}
                    className="w-full sm:w-auto px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <option value="All">{t.ynStatus.all}</option>
                    <option value="NO">{t.ynStatus.no}</option>
                    <option value="YES">{t.ynStatus.yes}</option>
                </select>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowDownTrayIcon className={`h-5 w-5 ${isExporting ? 'animate-pulse' : ''}`} />
                        {isExporting ? t.exporting : t.exportButton}
                    </button>
                    <button
                        onClick={loadAdjustments}
                        disabled={isLoading}
                        className="p-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Refresh"
                    >
                        <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </>
  );
};

export default Adjustment;