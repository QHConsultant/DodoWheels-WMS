import { PurchaseOrder } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../constants';

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  console.log('Fetching mock purchase orders...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_PURCHASE_ORDERS);
    }, 500); // Simulate network delay
  });
};
