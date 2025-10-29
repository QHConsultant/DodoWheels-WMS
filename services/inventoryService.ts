import { MOCK_INVENTORY } from '../constants';
import { InventoryItem } from '../types';

let mockInventoryDB = JSON.parse(JSON.stringify(MOCK_INVENTORY));

export const fetchInventory = async (): Promise<InventoryItem[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return Promise.resolve(JSON.parse(JSON.stringify(mockInventoryDB)));
};

export const updateInventoryStock = async (sku: string, totalQuantity: number): Promise<InventoryItem> => {
    // Simulate a successful API call
    await new Promise(resolve => setTimeout(resolve, 300));
    const itemIndex = mockInventoryDB.findIndex((item: InventoryItem) => item.sku === sku);

    if (itemIndex === -1) {
        throw new Error('Inventory item not found');
    }

    // A simple update logic. A real app might need to adjust locations too.
    mockInventoryDB[itemIndex] = { ...mockInventoryDB[itemIndex], totalQuantity };
    
    // Assuming the quantity is distributed to the first location for simplicity
    if (mockInventoryDB[itemIndex].locations.length > 0) {
        mockInventoryDB[itemIndex].locations[0].quantity = totalQuantity;
    }


    return Promise.resolve(mockInventoryDB[itemIndex]);
};