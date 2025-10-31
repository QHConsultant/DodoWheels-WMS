import { InventoryItem } from '../types';
import { supabase } from './supabaseService';

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  console.log('[Service] Fetching inventory directly from Supabase...');
  const { data, error } = await supabase
    .from('inventory')
    .select(`*, inventory_locations(*)`);

  if (error) {
    console.error("Supabase error fetching inventory:", error);
    throw new Error(error.message);
  }
  
  return data.map(item => ({
    sku: item.sku,
    productName: item.product_name,
    totalQuantity: item.total_quantity,
    locations: item.inventory_locations.map((loc: any) => ({
      locationId: loc.location_id,
      quantity: loc.quantity
    }))
  }));
};

export const updateInventoryStock = async (sku: string, totalQuantity: number): Promise<InventoryItem> => {
  console.log(`[Service] Updating inventory for ${sku} to quantity ${totalQuantity} in Supabase`);
  const { data, error } = await supabase
    .from('inventory')
    .update({ total_quantity: totalQuantity })
    .eq('sku', sku)
    .select()
    .single();

  if (error) {
    console.error("Supabase error updating inventory stock:", error);
    throw new Error(error.message);
  }

  const result = data as any;
  return {
      sku: result.sku,
      productName: result.product_name,
      totalQuantity: result.total_quantity,
      locations: [] // Assume unchanged on frontend, not returned by this update
  };
};
