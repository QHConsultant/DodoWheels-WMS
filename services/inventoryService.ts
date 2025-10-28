import { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../constants';

export const fetchInventory = async (): Promise<InventoryItem[]> => {
    console.log('Fetching mock inventory data...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_INVENTORY);
      }, 500); // Simulate network delay
    });
};
