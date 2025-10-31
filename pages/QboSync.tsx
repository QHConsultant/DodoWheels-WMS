import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocType, QboSyncItem } from '../types';
import { controlQboScraper, fetchSyncedData, generateAndDownloadCsv } from '../services/qboSyncService';
import { DocumentPlusIcon } from '../components/icons/DocumentPlusIcon';
import { Language, translations } from '../translations';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { ArrowDownTrayIcon } from '../components/icons/ArrowDownTrayIcon';

interface QboSyncProps {
    language: Language;
}

const getLogColor = (log: string): string => {
    if (log.includes('🔴') || log.toLowerCase().includes('error')) return 'text-red-400';
    if (log.includes('✅') || log.includes('🎉')) return 'text-green-400';
    if (log.includes('⚠️')) return 'text-yellow-400';
    if (log.includes('ℹ️') || log.includes('🌐') || log.includes('🚀') || log.includes('🔍') || log.includes('🔄')) return 'text-cyan-400';
    return 'text-slate-300';
};

const TableSkeleton: React.FC = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
          <td className="px-3 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
          <td className="px-3 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
          <td className="px-3 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
          <td className="px-3 py-4 hidden sm:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div></td>
          <td className="px-3 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
          <td className="px-3 py-4 hidden lg:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
        </tr>
      ))}
    </>
  );

const QboSync: React.FC<QboSyncProps> = ({ language }) => {
    const t = translations[language].qboSync;
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] ${t.logs.waiting}`]);
    const [agentReachable, setAgentReachable] = useState(true);

    const [syncedData, setSyncedData] = useState<QboSyncItem[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const pollStatus = useCallback(async (isInitialPoll = false) => {
        try {
            const status = await controlQboScraper('status');
            setLogs(status.logs);
            setIsBrowserOpen(status.browserOpen);
            setAgentReachable(true); 
            
            if (isFetching && !status.running) {
                setIsFetching(false);
                // When fetching stops, refresh the data table
                loadSyncedData();
            } else if (!isFetching) {
                 setIsFetching(status.running);
            }

        } catch (error) {
            console.error("Polling failed:", error);
            const errorMsg = `[${new Date().toLocaleTimeString()}] 🔴 Agent Unreachable: Please ensure the local agent.py script is running.`;
            setLogs(prev => prev[prev.length-1]?.includes('Unreachable') ? prev : [...prev, errorMsg]);
            setAgentReachable(false);
            setIsFetching(false);
        }
    }, [isFetching]);

    const loadSyncedData = useCallback(async () => {
        setIsDataLoading(true);
        setDataError(null);
        try {
            const data = await fetchSyncedData();
            setSyncedData(data);
        } catch (err) {
            setDataError((err as Error).message);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSyncedData();
    }, [loadSyncedData]);


    useEffect(() => {
        // Initial status check
        pollStatus(true);
        
        const intervalId = setInterval(pollStatus, 3000);
        return () => clearInterval(intervalId);
    }, [pollStatus]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCommand = async (command: 'open' | 'start_fetch' | 'reset', options?: { docType?: DocType }) => {
        if (!agentReachable) {
            alert("Cannot send command: The local Python agent is not running or is unreachable.");
            return;
        }
        if(command === 'start_fetch' || command === 'reset') {
            setIsFetching(true);
        }

        try {
            await controlQboScraper(command, options);
            await pollStatus();
        } catch (error) {
            console.error(`Command '${command}' failed:`, error);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Command failed: ${(error as Error).message}`]);
            setIsFetching(false);
        }
    };

    const handleExport = async () => {
        try {
            await generateAndDownloadCsv();
        } catch(e) {
            alert(`Failed to export: ${(e as Error).message}`);
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
                {!agentReachable && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-900/30 dark:text-red-300" role="alert">
                        <p className="font-bold">Local Agent Connection Failed</p>
                        <p>Could not connect to the local Selenium agent at `http://127.0.0.1:8008`. Please ensure you have started the `agent.py` script on your computer and that no firewall is blocking the connection.</p>
                    </div>
                )}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
                        <button onClick={() => handleCommand('open')} disabled={isFetching || isBrowserOpen || !agentReachable} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                            {t.openBrowserButton}
                        </button>
                        <button onClick={() => handleCommand('start_fetch', { docType: 'Invoice' })} disabled={!isBrowserOpen || isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            {isFetching ? '...' : t.fetchButtons.invoice}
                        </button>
                        <button onClick={() => handleCommand('start_fetch', { docType: 'Sale Receipts' })} disabled={!isBrowserOpen || isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            {isFetching ? '...' : t.fetchButtons.saleReceipts}
                        </button>
                        <button onClick={() => handleCommand('start_fetch', { docType: 'Credit Memo' })} disabled={!isBrowserOpen || isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                           {isFetching ? '...' : t.fetchButtons.creditMemo}
                        </button>
                        <button onClick={() => handleCommand('start_fetch', { docType: 'Estimate' })} disabled={!isBrowserOpen || isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            {isFetching ? '...' : t.fetchButtons.estimates}
                        </button>
                        <button onClick={() => handleCommand('reset')} disabled={isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed col-span-2 lg:col-span-1">
                            Reset Agent
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.fetchLogsTitle}</h4>
                    <div ref={logContainerRef} className="bg-slate-900 font-mono text-sm rounded-lg p-4 h-96 overflow-y-auto">
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

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <div className="p-4 sm:p-6 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.syncedDataTitle}</h2>
                        <div className="flex items-center space-x-2">
                             <button onClick={handleExport}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                <span className="hidden sm:inline">{t.exportButton}</span>
                            </button>
                            <button
                                onClick={loadSyncedData}
                                disabled={isDataLoading}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 disabled:opacity-50"
                            >
                                <RefreshIcon className={`h-5 w-5 ${isDataLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.date}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.type}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.docNumber}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.tableHeaders.customer}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.tableHeaders.product}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">{t.tableHeaders.qty}</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">{t.tableHeaders.description}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                {isDataLoading && <TableSkeleton />}
                                {!isDataLoading && dataError && (
                                    <tr><td colSpan={7} className="text-center py-12 px-4 text-red-500">{dataError}</td></tr>
                                )}
                                {!isDataLoading && !dataError && syncedData.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12 px-4 text-slate-500">{t.noItems}</td></tr>
                                )}
                                {!isDataLoading && !dataError && syncedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-3 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{item.date}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{item.type}</td>
                                        <td className="px-3 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-slate-800 dark:text-slate-200">{item.customer}</td>
                                        <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">{item.product}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-center font-bold hidden md:table-cell">{item.qty}</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 max-w-xs truncate hidden lg:table-cell">{item.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </main>
      </>
    );
};

export default QboSync;