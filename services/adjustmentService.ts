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
  console.log('[Service] Fetching all adjustments from Supabase...');

  // 1. Fetch unconfirmed from qbo_synced_data
  const { data: unconfirmedData, error: unconfirmedError } = await supabase
    .from('qbo_synced_data')
    .select('*')
    .eq('status', AdjustmentStatus.Unconfirmed)
    .order('created_at', { ascending: false });

  if (unconfirmedError) {
    console.error("Supabase error fetching unconfirmed adjustments:", unconfirmedError);
    throw new Error(`Failed to fetch unconfirmed adjustments: ${unconfirmedError.message}`);
  }

  const unconfirmedItems: AdjustmentLineItem[] = unconfirmedData.map(item => ({
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
      yn: 'N/A',
  }));

  // 2. Fetch all from qbo_updates
  const { data: confirmedData, error: confirmedError } = await supabase
    .from('qbo_updates')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (confirmedError) {
    console.error("Supabase error fetching confirmed adjustments:", confirmedError);
    throw new Error(`Failed to fetch confirmed adjustments: ${confirmedError.message}`);
  }
  
  const confirmedItems: AdjustmentLineItem[] = confirmedData.map(item => ({
    id: `upd-${item.id.toString()}`, // Prefix to avoid ID collision
    date: item.doc_date || '',
    customer: item.customer || '',
    productName: item.product || '',
    docType: item.doc_type,
    docNumber: item.doc_number || '',
    sku: item.sku || '',
    description: item.description || '', // Already parsed in this table
    qty: Math.abs(item.qty || 0),
    locations: [], // qbo_updates doesn't have multiple locations, just the selected one
    selectedLocation: item.selected_location || undefined,
    status: item.status || AdjustmentStatus.Confirmed,
    yn: item.yn === 'YES' ? 'YES' : 'NO', // Normalize the value
  }));


  // 3. Combine and return
  return [...unconfirmedItems, ...confirmedItems];
};


export const updateAdjustment = async (item: AdjustmentLineItem): Promise<AdjustmentLineItem | void> => {
  const signedQty = (item.docType === 'Invoice' || item.docType === 'Sale Receipts')
    ? -Math.abs(item.qty)
    : Math.abs(item.qty);

  // Case 1: A new item was created by copying. This is a final adjustment.
  if (item.isNew && item.originalId) {
    console.log(`[Service] Handling copied item. Creating record in qbo_updates and locking original ${item.originalId}.`);

    const newRecordPayload = {
      doc_date: item.date,
      customer: item.customer,
      product: item.productName,
      doc_type: item.docType,
      doc_number: item.docNumber,
      sku: item.sku,
      description: item.description,
      qty: signedQty,
      selected_location: item.selectedLocation,
      status: AdjustmentStatus.Confirmed,
      source_id: item.originalId,
      opt: signedQty > 0 ? 'IN' : 'OUT',
      yn: 'NO',
    };

    const { error: insertError } = await supabase.from('qbo_updates').insert(newRecordPayload);

    if (insertError) {
      console.error(`Supabase error inserting into qbo_updates:`, insertError);
      throw new Error(`Failed to create new adjustment record: ${insertError.message}`);
    }

    const { error: updateError } = await supabase
      .from('qbo_synced_data')
      .update({ status: AdjustmentStatus.Confirmed })
      .eq('id', item.originalId);
    
    if (updateError) {
      console.error(`Supabase error updating original record ${item.originalId}:`, updateError);
      throw new Error(`Failed to lock original adjustment record: ${updateError.message}`);
    }
    
    return;

  // Case 2: An existing item was simply edited (not a final confirmation).
  } else if (!item.id.startsWith('new-') && !item.id.startsWith('upd-')) {
    console.log(`[Service] Updating adjustment ${item.id} in Supabase...`);

    const payload = {
      sku: item.sku,
      description: item.description,
      qty: signedQty,
      selected_location: item.selectedLocation,
      status: item.status,
    };

    const { data, error } = await supabase
      .from('qbo_synced_data')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating adjustment ${item.id}:`, error);
      throw new Error(`Failed to update adjustment: ${error.message}`);
    }
    
    return {
      id: data.id.toString(),
      date: data.doc_date || '',
      customer: data.customer || '',
      productName: data.product || '',
      docType: data.doc_type,
      docNumber: data.doc_number || '',
      sku: data.sku || '',
      description: parseDescription(data.description),
      qty: Math.abs(data.qty || 0),
      locations: parseLocations(data.description),
      selectedLocation: data.selected_location || undefined,
      status: data.status || AdjustmentStatus.Unconfirmed,
    };
  }
};

export const exportAdjustmentsAndMarkAsExported = async (): Promise<any[] | null> => {
    console.log('[Service] Fetching non-exported adjustments for CSV export...');
    
    const { data: recordsToExport, error: fetchError } = await supabase
      .from('qbo_updates')
      .select('*')
      .eq('yn', 'NO');

    if (fetchError) {
      console.error("Supabase error fetching records to export:", fetchError);
      throw new Error(`Failed to fetch records for export: ${fetchError.message}`);
    }

    if (!recordsToExport || recordsToExport.length === 0) {
      return null;
    }

    const idsToUpdate = recordsToExport.map(r => r.id);
    const { error: updateError } = await supabase
      .from('qbo_updates')
      .update({ yn: 'YES' })
      .in('id', idsToUpdate);

    if (updateError) {
      console.error("Supabase error updating records to 'YES':", updateError);
      throw new Error(`Failed to mark records as exported: ${updateError.message}`);
    }

    console.log(`[Service] Successfully marked ${recordsToExport.length} records as exported.`);
    
    return recordsToExport;
  };