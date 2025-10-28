import { InventoryItem } from '../types';

export const fetchInventory = async (): Promise<InventoryItem[]> => {
    console.log('Fetching inventory from QBO API...');
    const response = await fetch('/api/inventory');
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch inventory from the server.' }));
        if (response.status === 401 || response.status === 503) {
            throw new Error('QuickBooks Online connection required. Please connect from the Outbound page.');
        }
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
    }
    
    return response.json();
};
