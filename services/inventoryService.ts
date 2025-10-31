import { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../constants';

let localInventory: InventoryItem[] = JSON.parse(JSON.stringify(MOCK_INVENTORY));

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  console.log('[Service] Fetching mock inventory...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(localInventory)));
    }, 500);
  });
};

export const updateInventoryStock = async (sku: string, totalQuantity: number): Promise<InventoryItem> => {
  console.log(`[Service] Updating mock inventory for ${sku} to quantity ${totalQuantity}`);
  let updatedItem: InventoryItem | undefined;
  
  localInventory = localInventory.map(item => {
    if (item.sku === sku) {
      // For simplicity, we update the total quantity and assume the first location holds all stock.
      const newLocations = item.locations.length > 0 
        ? [{ ...item.locations[0], quantity: totalQuantity }] 
        : [{ locationId: 'UNKNOWN', quantity: totalQuantity }];

      updatedItem = { ...item, totalQuantity, locations: newLocations };
      return updatedItem;
    }
    return item;
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (updatedItem) {
        resolve(updatedItem);
      } else {
        reject(new Error('Mock Item not found'));
      }
    }, 300);
  });
};
