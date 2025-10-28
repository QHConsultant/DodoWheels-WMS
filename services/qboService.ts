import { Order } from '../types';
import { MOCK_ORDERS } from '../constants';

// This function simulates a network request.
export const fetchOrders = async (): Promise<Order[]> => {
  console.log('Fetching mock orders...');
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_ORDERS);
    }, 500); // Simulate network delay
  });
};
