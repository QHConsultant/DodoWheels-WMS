import { PurchaseOrder } from '../types';
import { MOCK_PURCHASE_ORDERS } from '../constants';

let localPOs: PurchaseOrder[] = JSON.parse(JSON.stringify(MOCK_PURCHASE_ORDERS));

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  console.log('[Service] Fetching mock purchase orders...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(localPOs)));
    }, 500);
  });
};

export const updatePurchaseOrder = async (updatedPO: PurchaseOrder): Promise<void> => {
  console.log(`[Service] Updating mock PO ${updatedPO.id}`);
  const index = localPOs.findIndex(po => po.id === updatedPO.id);
  if (index !== -1) {
    localPOs[index] = updatedPO;
  }
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
};
