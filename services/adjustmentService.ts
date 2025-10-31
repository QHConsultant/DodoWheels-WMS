import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { supabase } from './supabaseService';

const parseLocations = (description: string = ''): string[] => {
    const parts = description.split('@');
    if (parts.length > 1) {
      return parts[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};
  
const parseDescription = (description: string = ''): string => {
    return description.split('@')[0].trim();
};


export const fetchAdjustments = async (): Promise<AdjustmentLineItem[]> => {
  console.log('[Service] Fetching adjustments directly from Supabase...');
  const { data, error } = await supabase
    .from('qbo_synced_data')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase error fetching adjustments:", error);
    throw new Error(`Failed to fetch adjustments: ${error.message}`);
  }

  // Map Supabase data (snake_case) to frontend model (camelCase)
  return data.map(item => ({
      id: item.id.toString(),
      date: item.doc_date || '',
      customer: item.customer || '',
      productName: item.product || '',
      docType: item.doc_type,
      docNumber: item.doc_number || '',
      sku: item.sku || '',
      description: parseDescription(item.description),
      qty: Math.abs(item.qty || 0),
      locations: parseLocations(item.description),
      selectedLocation: item.selected_location || undefined,
      status: item.status || AdjustmentStatus.Unconfirmed,
  }));
};

export const updateAdjustment = async (item: AdjustmentLineItem): Promise<AdjustmentLineItem> => {
  console.log(`[Service] Updating adjustment ${item.id} directly in Supabase...`);
  const { data, error } = await supabase
    .from('qbo_synced_data')
    .update({
      sku: item.sku,
      description: `${item.description} @ ${item.locations.join(', ')}`,
      qty: item.qty,
      selected_location: item.selectedLocation,
      status: item.status,
    })
    .eq('id', item.id)
    .select()
    .single(); // .single() ensures we get a single object back, not an array

  if (error) {
    console.error(`Supabase error updating adjustment ${item.id}:`, error);
    throw new Error(`Failed to update adjustment: ${error.message}`);
  }
  
  // Map the response back to the frontend model
  const updatedItem = data;
  return {
    id: updatedItem.id.toString(),
    date: updatedItem.doc_date || '',
    customer: updatedItem.customer || '',
    productName: updatedItem.product || '',
    docType: updatedItem.doc_type,
    docNumber: updatedItem.doc_number || '',
    sku: updatedItem.sku || '',
    description: parseDescription(updatedItem.description),
    qty: Math.abs(updatedItem.qty || 0),
    locations: parseLocations(updatedItem.description),
    selectedLocation: updatedItem.selected_location || undefined,
    status: updatedItem.status || AdjustmentStatus.Unconfirmed,
  };
};
