import { Order, OrderStatus } from '../types';
import { supabase } from './supabaseService';

export const fetchOrders = async (): Promise<Order[]> => {
  console.log('[Service] Fetching orders directly from Supabase...');
  const { data, error } = await supabase
    .from('orders')
    .select(`
        id,
        customer_name,
        order_date,
        status,
        total_amount,
        order_line_items ( * )
    `)
    .order('order_date', { ascending: false });

  if (error) {
    console.error("Supabase error fetching orders:", error);
    throw new Error(error.message);
  }

  // Map to frontend camelCase format
  return data.map(order => ({
    id: order.id,
    customerName: order.customer_name,
    orderDate: order.order_date,
    status: order.status,
    totalAmount: order.total_amount,
    lineItems: order.order_line_items.map((item: any) => ({
      sku: item.sku,
      productName: item.product_name,
      quantity: item.quantity,
      location: item.location,
      stockStatus: item.stock_status,
    }))
  }));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    console.log(`[Service] Updating order ${orderId} to status ${status} directly in Supabase`);
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase error updating order status:", error);
      throw new Error(error.message);
    }
    
    // The updated data is returned, we just need to ensure the keys are camelCased
    // (though in this case, only 'status' is updated, which is already correct)
    const result = data as any;
    return {
        ...result,
        customerName: result.customer_name,
        orderDate: result.order_date,
        totalAmount: result.total_amount,
        lineItems: [] // This data isn't returned on update, assume unchanged on frontend
    };
}
