import { MOCK_PURCHASE_ORDERS } from '../constants';
import { PurchaseOrder } from '../types';

let mockPurchaseOrdersDB = JSON.parse(JSON.stringify(MOCK_PURCHASE_ORDERS));

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return Promise.resolve(JSON.parse(JSON.stringify(mockPurchaseOrdersDB)));
};

export const updatePurchaseOrder = async (po: PurchaseOrder): Promise<void> => {
    // Simulate a successful API call
    await new Promise(resolve => setTimeout(resolve, 300));
    const poIndex = mockPurchaseOrdersDB.findIndex((p: PurchaseOrder) => p.id === po.id);
    if (poIndex !== -1) {
        mockPurchaseOrdersDB[poIndex] = po;
    } else {
        throw new Error('Purchase Order not found');
    }
    return Promise.resolve();
};