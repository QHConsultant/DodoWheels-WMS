import { AdjustmentLineItem } from '../types';

export const fetchAdjustments = async (): Promise<AdjustmentLineItem[]> => {
  console.log('[Service] fetchAdjustments: Starting API call to /api/adjustments');
  // Simulate network delay to be consistent with other services
  await new Promise(resolve => setTimeout(resolve, 500));
  const response = await fetch('/api/adjustments');
  console.log('[Service] fetchAdjustments: Received response with status', response.status);

  if (!response.ok) {
    console.error('[Service] fetchAdjustments: API call failed.', { status: response.status, statusText: response.statusText });
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    } catch (e) {
      throw new Error(`Failed to fetch adjustments from API: ${response.statusText}`);
    }
  }
  const data = await response.json();
  console.log(`[Service] fetchAdjustments: Parsed ${data.length} items successfully.`);
  return data;
};

export const updateAdjustment = async (item: AdjustmentLineItem): Promise<AdjustmentLineItem> => {
    console.log(`[Service] updateAdjustment: Starting API call to /api/adjustments/${item.id}`, { item });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await fetch(`/api/adjustments/${item.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    });
    console.log(`[Service] updateAdjustment: Received response for item ${item.id} with status`, response.status);

    if (!response.ok) {
        console.error(`[Service] updateAdjustment: API call failed for item ${item.id}.`, { status: response.status, statusText: response.statusText });
        try {
            const errorData = await response.json();
            throw new Error(errorData.error || `API Error on update: ${response.statusText}`);
        } catch (e) {
            throw new Error(`Failed to update adjustment via API: ${response.statusText}`);
        }
    }
    const data = await response.json();
    console.log(`[Service] updateAdjustment: Parsed response for item ${item.id} successfully.`, { data });
    return data;
};