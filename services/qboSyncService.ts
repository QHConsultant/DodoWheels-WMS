
import { DocType, QboSyncItem } from '../types';

// The local address of the Python agent
const AGENT_BASE_URL = 'http://127.0.0.1:8008';

export interface AgentStatus {
    running: boolean;
    browserOpen: boolean;
    logs: string[];
}

/**
 * Sends a command to the LOCAL Python Selenium agent.
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
            const errorData = await response.json().catch(() => ({ detail: 'Failed to communicate with the local agent.' }));
            throw new Error(errorData.detail || `Agent responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error(`Error sending command '${command}' to local agent:`, error);
        // This catch block is crucial for detecting if the agent is offline.
        throw new Error('Local agent is unreachable. Please ensure agent.py is running.');
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
