import { MOCK_ORDERS } from '../constants';
import { Order, OrderStatus } from '../types';

let mockOrdersDB = JSON.parse(JSON.stringify(MOCK_ORDERS));

export const fetchOrders = async (): Promise<Order[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return a copy to prevent direct mutation of the mock data
  return Promise.resolve(JSON.parse(JSON.stringify(mockOrdersDB)));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orderIndex = mockOrdersDB.findIndex((o: Order) => o.id === orderId);

    if (orderIndex === -1) {
        throw new Error('Order not found');
    }

    mockOrdersDB[orderIndex] = { ...mockOrdersDB[orderIndex], status };

    return Promise.resolve(mockOrdersDB[orderIndex]);
}