import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { fetchAdjustments, updateAdjustment } from '../services/adjustmentService';
import { Language, translations } from '../translations';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { AdjustmentTableRow } from '../components/AdjustmentTableRow';

interface AdjustmentProps {
  language: Language;
}

const Adjustment: React.FC<AdjustmentProps> = ({ language }) => {
  const [adjustments, setAdjustments] = useState<AdjustmentLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | 'All'>('Unconfirmed');

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
        setAdjustments(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    } catch (err) {
        console.error('Failed to update item:', err);
        // Optionally show an error to the user
    }
  };

  const filteredAdjustments = useMemo(() => {
    return adjustments
      .filter(item => {
        if (statusFilter === 'All') return true;
        return item.status === statusFilter;
      })
      .filter(item =>
        item.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [adjustments, searchTerm, statusFilter]);

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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.docNumber}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.sku}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.description}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.qty}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.locations}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.status}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.action}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-8 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24 mx-auto"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20 mx-auto"></div></td>
                    </tr>
                  ))
                ) : filteredAdjustments.length > 0 ? (
                    filteredAdjustments.map((item) => (
                        <AdjustmentTableRow
                            key={item.id}
                            item={item}
                            onUpdate={handleUpdate}
                            language={language}
                        />
                    ))
                ) : (
                    <tr>
                        <td colSpan={7} className="text-center py-12 px-6">
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SwitchHorizontalIcon className="h-7 w-7 text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.title}
              </h1>
            </div>
             <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="All">{t.status.all}</option>
                    <option value={AdjustmentStatus.Unconfirmed}>{t.status.unconfirmed}</option>
                    <option value={AdjustmentStatus.Confirmed}>{t.status.confirmed}</option>
                </select>
               <button
                  onClick={loadAdjustments}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? t.refreshing : t.refresh}
                </button>
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