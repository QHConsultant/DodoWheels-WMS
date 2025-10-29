import React, { useState, useEffect, useRef } from 'react';
import { DocType } from '../types';
import { controlQboScraper } from '../services/qboSyncService';
import { DocumentPlusIcon } from '../components/icons/DocumentPlusIcon';
import { Language, translations } from '../translations';

interface QboSyncProps {
    language: Language;
}

// Helper function to determine log color based on content
const getLogColor = (log: string): string => {
    if (log.includes('🔴') || log.toLowerCase().includes('error')) {
        return 'text-red-400';
    }
    if (log.includes('✅') || log.includes('🎉')) {
        return 'text-green-400';
    }
    if (log.includes('ℹ️') || log.includes('🌐') || log.includes('🚀') || log.includes('🔍') || log.includes('🔄')) {
        return 'text-cyan-400';
    }
    return 'text-slate-300'; // Default color
};

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
                        // Data is no longer displayed on this page, so no need to refresh it.
                    }
                } catch (error) {
                    console.error("Polling failed:", error);
                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Polling Error: ${(error as Error).message}`]);
                    setIsFetching(false); // Stop polling on error
                }
            }, 2000);
        }
        return () => clearInterval(intervalId);
    }, [isFetching, t.logs.waiting]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleOpenBrowser = async () => {
        // Open the QBO page in a new tab to simulate the browser action
        window.open('https://qbo.intuit.com/app/sales', '_blank');

        try {
            // Then, update the backend's simulated state
            const response = await controlQboScraper('open');
            setLogs(response.logs);
            setIsBrowserOpen(response.browserOpen);
            if (response.browserOpen) {
                alert(t.browserOpenedAlert);
            }
        } catch (error) {
            console.error("Scraper 'open' command failed:", error);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Backend error: ${(error as Error).message}`]);
            setIsBrowserOpen(false); // Ensure UI reflects the failure
        }
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
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : 'export.csv';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error}`);
        }
    };

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset the scraper? This will clear all fetched data and close the 'browser' session.")) {
            setIsFetching(true); // Reuse isFetching to show a loading state on all buttons
            try {
                const response = await controlQboScraper('reset');
                setLogs(response.logs);
                setIsBrowserOpen(response.browserOpen);
                setIsFetching(response.running);
            } catch (error) {
                console.error("Reset failed:", error);
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Reset Error: ${(error as Error).message}`]);
                setIsFetching(false);
            }
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
            <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
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
                        <button onClick={handleReset} disabled={isFetching} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed">
                            Reset Scraper
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.fetchLogsTitle}</h4>
                    <div ref={logContainerRef} className="bg-slate-900 font-mono text-sm rounded-lg p-4 h-64 overflow-y-auto">
                        {logs.map((log, index) => (
                            <p key={index} className={`whitespace-pre-wrap leading-relaxed ${getLogColor(log)}`}>{log}</p>
                        ))}
                        {isFetching && (
                            <div className="flex items-center text-slate-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-3"></div>
                                <span>Processing...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
      </>
    );
};

export default QboSync;