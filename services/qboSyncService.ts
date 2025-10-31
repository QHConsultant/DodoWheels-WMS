import { DocType, QboSyncItem } from '../types';
import { MOCK_QBO_SYNC_ITEMS } from '../constants';

const AGENT_BASE_URL = 'http://127.0.0.1:8008';

export interface AgentStatus {
    running: boolean;
    browserOpen: boolean;
    logs: string[];
}

export const controlQboScraper = async (
    command: 'open' | 'start_fetch' | 'status' | 'reset',
    options?: { docType?: DocType }
): Promise<AgentStatus> => {
    const endpoint = command === 'status' ? `${AGENT_BASE_URL}/status` : `${AGENT_BASE_URL}/control`;
    const method = command === 'status' ? 'GET' : 'POST';

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method === 'POST' ? JSON.stringify({ command, ...options }) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `Agent responded with an error (status ${response.status})` }));
            throw new Error(errorData.detail || `Agent responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error(`Error sending command '${command}' to local agent:`, error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Local agent is unreachable. Please ensure agent.py is running and allows CORS requests from this web application.');
        }
        throw new Error(`Failed to communicate with local agent: ${error.message}`);
    }
};


export const fetchSyncedData = async (): Promise<QboSyncItem[]> => {
    console.log('[Service] Fetching mock synced_data...');
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_QBO_SYNC_ITEMS);
        }, 500);
    });
};

// This function now generates the CSV client-side from fetched data.
export const generateAndDownloadCsv = async () => {
    console.log("Generating CSV from fetched data...");
    const data = await fetchSyncedData();

    if (!data || data.length === 0) {
        alert('No data available to export.');
        return;
    }

    const escapeCsvField = (field: any): string => {
        const strField = String(field ?? '');
        if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
            return `"${strField.replace(/"/g, '""')}"`;
        }
        return strField;
    };
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => escapeCsvField((row as any)[header]));
        csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('download', `qbo_export_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};