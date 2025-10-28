import { Order, OrderStatus } from '../types';
import { MOCK_ORDERS } from '../constants';

// Create a mutable copy for in-session persistence
let sessionOrders: Order[] = JSON.parse(JSON.stringify(MOCK_ORDERS));

export const fetchOrders = async (): Promise<Order[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return mock data instead of fetching from API
  return Promise.resolve(sessionOrders);
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    // Simulate network delay and update in-memory data
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orderIndex = sessionOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        throw new Error('Order not found in mock data.');
    }
    
    // Update the in-memory array
    sessionOrders[orderIndex] = { ...sessionOrders[orderIndex], status };
    
    // Return the updated object
    return Promise.resolve(sessionOrders[orderIndex]);
}
