

import React, { useState, useEffect, useRef } from 'react';
import { DocType } from '../types';
import { controlQboScraper } from '../services/qboSyncService';
import { DocumentPlusIcon } from '../components/icons/DocumentPlusIcon';
import { Language, translations } from '../translations';

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

const QboSync: React.FC<QboSyncProps> = ({ language }) => {
    const t = translations[language].qboSync;
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [logs, setLogs] = useState<string[]>([`[${new Date().toLocaleTimeString()}] ${t.logs.waiting}`]);
    const [agentReachable, setAgentReachable] = useState(true);

    const pollStatus = async () => {
        try {
            const status = await controlQboScraper('status');
            setLogs(status.logs);
            setIsBrowserOpen(status.browserOpen);
            setAgentReachable(true); // Agent is reachable
            if (!status.running && isFetching) {
                setIsFetching(false);
            }
        } catch (error) {
            console.error("Polling failed:", error);
            const errorMsg = `[${new Date().toLocaleTimeString()}] 🔴 Agent Unreachable: Please ensure the local agent.py script is running.`;
            if (logs[logs.length-1] !== errorMsg) {
                 setLogs(prev => [...prev, errorMsg]);
            }
            setAgentReachable(false);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        // Initial status check
        pollStatus();
        
        // Setup polling interval
        const intervalId = setInterval(pollStatus, 3000);
        return () => clearInterval(intervalId);
    }, [isFetching]); // Re-evaluate if isFetching changes

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCommand = async (command: 'open' | 'start_fetch' | 'reset', options?: { docType?: DocType }) => {
        // FIX: The `command !== 'status'` check was redundant and caused a type error, as `command` can never be 'status' here. The `!agentReachable` check is sufficient.
        if (!agentReachable) {
            alert("Cannot send command: The local Python agent is not running or is unreachable.");
            return;
        }
        if(command === 'start_fetch') setIsFetching(true);
        if(command === 'reset') setIsFetching(true); // Disable buttons during reset

        try {
            await controlQboScraper(command, options);
            // Immediately poll for status update after sending a command
            await pollStatus();
        } catch (error) {
            console.error(`Command '${command}' failed:`, error);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔴 Command failed: ${(error as Error).message}`]);
            setIsFetching(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/export_csv');
            if (!response.ok) throw new Error(await response.text());
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `qbo_export_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert(`Export failed: ${error}`);
        }
    };

    return (
      <>
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx_auto px-4 sm:px-6 lg:px-8">
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
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">Local Agent Connection Failed</p>
                        <p>Could not connect to the local Selenium agent at `http://127.0.0.1:8008`. Please ensure you have started the `agent.py` script on your computer and that no firewall is blocking the connection.</p>
                    </div>
                )}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex flex-wrap items-center gap-4">
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
                        <button onClick={handleExport} disabled={isFetching} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed">
                            {t.exportButton}
                        </button>
                        <button onClick={() => handleCommand('reset')} disabled={isFetching || !agentReachable} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed">
                            Reset Agent
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