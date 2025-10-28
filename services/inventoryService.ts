import { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../constants';

// Create a mutable copy for in-session persistence
let sessionInventory: InventoryItem[] = JSON.parse(JSON.stringify(MOCK_INVENTORY));


export const fetchInventory = async (): Promise<InventoryItem[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return mock data
    return Promise.resolve(sessionInventory);
};

export const updateInventoryStock = async (sku: string, totalQuantity: number): Promise<InventoryItem> => {
    // Simulate a successful API call and update in-memory data
    await new Promise(resolve => setTimeout(resolve, 300));

    const itemIndex = sessionInventory.findIndex(i => i.sku === sku);
    if (itemIndex === -1) {
        throw new Error('Inventory item not found in mock data.');
    }
    
    // Update the in-memory array
    sessionInventory[itemIndex] = { ...sessionInventory[itemIndex], totalQuantity };

    // Return the updated object
    return Promise.resolve(sessionInventory[itemIndex]);
};
