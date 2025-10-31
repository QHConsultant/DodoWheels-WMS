import { Order, OrderStatus } from '../types';
import { MOCK_ORDERS } from '../constants';

// Create a deep copy of the mock data to allow for mutation without affecting the original constant.
let localOrders: Order[] = JSON.parse(JSON.stringify(MOCK_ORDERS));

export const fetchOrders = async (): Promise<Order[]> => {
  console.log('[Service] Fetching mock orders...');
  return new Promise(resolve => {
    // Simulate network delay
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(localOrders))); // Return a copy
    }, 500);
  });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    console.log(`[Service] Updating mock order ${orderId} to status ${status}`);
    let updatedOrder: Order | undefined;
    
    localOrders = localOrders.map(order => {
        if (order.id === orderId) {
            updatedOrder = { ...order, status };
            return updatedOrder;
        }
        return order;
    });

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (updatedOrder) {
                resolve(updatedOrder);
            } else {
                reject(new Error("Mock Order not found"));
            }
        }, 300);
    });
}
