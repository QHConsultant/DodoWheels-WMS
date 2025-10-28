import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DocType } from '../types';
import { controlQboScraper } from '../services/qboSyncService';
import { DocumentPlusIcon } from '../components/icons/DocumentPlusIcon';
import { Language, translations } from '../translations';

interface QboSyncProps {
    language: Language;
}

const QboSync: React.FC<QboSyncProps> = ({ language }) => {
    const t = translations[language].qboSync;
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] ${t.logs.waiting}`]);
    
    // Polling effect
    useEffect(() => {
        let intervalId: number;
        if (isFetching) {
            intervalId = window.setInterval(async () => {
                try {
                    const status = await controlQboScraper('status');
                    setLogs(status.logs);
                    if (!status.running) {
                        setIsFetching(false);
                    }
                } catch (error) {
                    console.error("Polling failed:", error);
                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Polling Error: ${(error as Error).message}`]);
                    setIsFetching(false); // Stop polling on error
                }
            }, 2000);
        }
        return () => clearInterval(intervalId);
    }, [isFetching]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleOpenBrowser = async () => {
        const response = await controlQboScraper('open');
        setLogs(response.logs);
        setIsBrowserOpen(response.browserOpen);
    };

    const handleStartFetch = async (docType: DocType) => {
        setIsFetching(true);
        const response = await controlQboScraper('start_fetch', { docType });
        setLogs(response.logs);
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/export_csv');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to export data.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error}`);
        }
    };


    return (
      <>
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <DocumentPlusIcon className="h-7 w-7 text-indigo-500" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8">
                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={handleOpenBrowser} disabled={isFetching || isBrowserOpen} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        {t.openBrowserButton}
                    </button>
                    <button onClick={() => handleStartFetch('Invoice')} disabled={!isBrowserOpen || isFetching} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {isFetching ? '...' : t.fetchButtons.invoice}
                    </button>
                     <button onClick={() => handleStartFetch('Sale Receipts')} disabled={!isBrowserOpen || isFetching} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {isFetching ? '...' : t.fetchButtons.saleReceipts}
                    </button>
                     <button onClick={() => handleStartFetch('Credit Memo')} disabled={!isBrowserOpen || isFetching} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {isFetching ? '...' : t.fetchButtons.creditMemo}
                    </button>
                     <button onClick={() => handleStartFetch('Estimate')} disabled={!isBrowserOpen || isFetching} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {isFetching ? '...' : t.fetchButtons.estimates}
                    </button>
                    <button onClick={handleExport} disabled={isFetching} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed">
                        {t.exportButton}
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.fetchLogsTitle}</h4>
                <div ref={logContainerRef} className="bg-slate-900 text-slate-300 font-mono text-sm rounded-lg p-4 h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                        <p key={index} className="whitespace-pre-wrap leading-relaxed">{log}</p>
                    ))}
                     {isFetching && (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-3"></div>
                            <span>Processing...</span>
                        </div>
                    )}
                </div>
            </div>
        </main>
      </>
    );
};

export default QboSync;