import { PurchaseOrder } from '../types';
import { supabase } from './supabaseService';

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  console.log('[Service] Fetching purchase orders directly from Supabase...');
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`*, po_line_items(*)`)
    .order('order_date', { ascending: false });

  if (error) {
    console.error("Supabase error fetching POs:", error);
    throw new Error(error.message);
  }

  return data.map(po => ({
    id: po.id,
    supplier: po.supplier,
    orderDate: po.order_date,
    expectedDelivery: po.expected_delivery,
    status: po.status,
    items: po.po_line_items.map((item: any) => ({
      sku: item.sku,
      productName: item.product_name,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_received,
    }))
  }));
};

export const updatePurchaseOrder = async (updatedPO: PurchaseOrder): Promise<void> => {
  console.log(`[Service] Updating PO ${updatedPO.id} directly in Supabase`);
  
  // 1. Update the main PO status
  const { error: poError } = await supabase
    .from('purchase_orders')
    .update({ status: updatedPO.status })
    .eq('id', updatedPO.id);

  if (poError) {
    console.error("Supabase error updating PO status:", poError);
    throw new Error(poError.message);
  }

  // 2. Update each line item's received quantity
  for (const item of updatedPO.items) {
    const { error: itemError } = await supabase
      .from('po_line_items')
      .update({ quantity_received: item.quantityReceived })
      .eq('po_id', updatedPO.id)
      .eq('sku', item.sku);

    if (itemError) {
      console.error(`Supabase error updating PO item ${item.sku}:`, itemError);
      // We can choose to continue or throw here. For now, let's log and continue.
    }
  }
};
