import { DocType, QboSyncItem } from '../types';

interface ScraperStatus {
    running: boolean;
    browserOpen: boolean;
    logs: string[];
}

/**
 * Sends a command to the Selenium-style QBO scraper simulation on the backend.
 * @param command The command to execute ('open', 'start_fetch', 'status', 'reset').
 * @param options Additional options, like the docType for 'start_fetch'.
 * @returns The current status from the scraper.
 */
export const controlQboScraper = async (
    command: 'open' | 'start_fetch' | 'status' | 'reset',
    options?: { docType?: DocType }
): Promise<ScraperStatus> => {
    try {
        const response = await fetch('/api/selenium/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command, ...options }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to communicate with the server.' }));
            throw new Error(errorData.message || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error(`Error sending command '${command}' to scraper:`, error);
        throw error;
    }
};

export const fetchSyncedData = async (): Promise<QboSyncItem[]> => {
    try {
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
