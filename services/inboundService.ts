import { PurchaseOrder } from '../types';

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  console.log('Fetching purchase orders from QBO API...');
  const response = await fetch('/api/purchase-orders');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch purchase orders from the server.' }));
    if (response.status === 401 || response.status === 503) {
      throw new Error('QuickBooks Online connection required. Please connect from the Outbound page.');
    }
    throw new Error(errorData.message || `Server responded with status ${response.status}`);
  }

  return response.json();
};
