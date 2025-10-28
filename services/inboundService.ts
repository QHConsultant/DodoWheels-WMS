import { PurchaseOrder } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../constants';

// Create a mutable copy for in-session persistence
let sessionPOs: PurchaseOrder[] = JSON.parse(JSON.stringify(MOCK_PURCHASE_ORDERS));

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return mock data
  return Promise.resolve(sessionPOs);
};

export const updatePurchaseOrder = async (po: PurchaseOrder): Promise<void> => {
    // Simulate a successful API call and update in-memory data
    await new Promise(resolve => setTimeout(resolve, 300));
    const poIndex = sessionPOs.findIndex(p => p.id === po.id);
    if (poIndex !== -1) {
        sessionPOs[poIndex] = po;
    }
    console.log('Simulating update for PO:', po);
    return Promise.resolve();
};
