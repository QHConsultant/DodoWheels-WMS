

import { DocType, QboSyncItem } from '../types';

// The local agent is proxied through our own backend to avoid CORS issues.
const AGENT_BASE_URL = '/api/agent';

export interface AgentStatus {
    running: boolean;
    browserOpen: boolean;
    logs: string[];
}

/**
 * Sends a command to the LOCAL Python Selenium agent via the backend proxy.
 * @param command The command to execute ('open', 'start_fetch', 'status', 'reset').
 * @param options Additional options, like the docType for 'start_fetch'.
 * @returns The current status from the agent.
 */
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
            const errorData = await response.json().catch(() => ({ detail: 'Failed to communicate with the local agent proxy.' }));
            throw new Error(errorData.detail || `Proxy responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error(`Error sending command '${command}' to local agent via proxy:`, error);
        // This catch block handles network errors (proxy down) or errors thrown from the response check.
        throw new Error('Local agent is unreachable via proxy. Please ensure agent.py is running and the backend server is running correctly.');
    }
};


export const fetchSyncedData = async (): Promise<QboSyncItem[]> => {
    try {
        // This still fetches from the main backend API, which reads from the shared Supabase DB.
        const response = await fetch('/api/synced_data');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch synced data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching synced data:', error);
        throw error;
    }
};