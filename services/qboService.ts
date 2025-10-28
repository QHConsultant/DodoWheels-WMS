import { Order } from '../types';

// This function now fetches from the API
export const fetchOrders = async (): Promise<Order[]> => {
  console.log('Fetching orders from QBO API...');
  const response = await fetch('/api/orders');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch orders from the server.' }));
    if (response.status === 401 || response.status === 503) {
      throw new Error('QuickBooks Online connection required. Please connect from the Outbound page.');
    }
    throw new Error(errorData.message || `Server responded with status ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};
