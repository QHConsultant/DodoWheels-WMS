import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { supabase } from './supabaseService';

const parseLocations = (description: string = ''): string[] => {
    const parts = description.split('@');
    if (parts.length > 1) {
      return parts[1]
        .split(',')
        .map(s => s.trim().split('*')[0].trim())
        .filter(Boolean);
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
  const isNew = item.id.startsWith('new-');

  const fullDescription = item.locations.length > 0
    ? `${item.description} @ ${item.locations.join(', ')}`
    : item.description;

  const signedQty = (item.docType === 'Invoice' || item.docType === 'Sale Receipts')
    ? -Math.abs(item.qty)
    : Math.abs(item.qty);

  const payload = {
    doc_date: item.date,
    customer: item.customer,
    product: item.productName,
    doc_type: item.docType,
    doc_number: item.docNumber,
    sku: item.sku,
    description: fullDescription,
    qty: signedQty,
    selected_location: item.selectedLocation,
    status: item.status,
  };

  let response;
  if (isNew) {
    console.log('[Service] Inserting new adjustment in Supabase...');
    response = await supabase
      .from('qbo_synced_data')
      .insert(payload)
      .select()
      .single();
  } else {
    console.log(`[Service] Updating adjustment ${item.id} in Supabase...`);
    response = await supabase
      .from('qbo_synced_data')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();
  }

  const { data, error } = response;

  if (error) {
    const errorMessage = isNew ? 'inserting adjustment' : `updating adjustment ${item.id}`;
    console.error(`Supabase error ${errorMessage}:`, error);
    throw new Error(`Failed to ${isNew ? 'create' : 'update'} adjustment: ${error.message}`);
  }

  const updatedItemFromDb = data;
  return {
    id: updatedItemFromDb.id.toString(),
    date: updatedItemFromDb.doc_date || '',
    customer: updatedItemFromDb.customer || '',
    productName: updatedItemFromDb.product || '',
    docType: updatedItemFromDb.doc_type,
    docNumber: updatedItemFromDb.doc_number || '',
    sku: updatedItemFromDb.sku || '',
    description: parseDescription(updatedItemFromDb.description),
    qty: Math.abs(updatedItemFromDb.qty || 0),
    locations: parseLocations(updatedItemFromDb.description),
    selectedLocation: updatedItemFromDb.selected_location || undefined,
    status: updatedItemFromDb.status || AdjustmentStatus.Unconfirmed,
  };
};