import { AdjustmentLineItem } from '../types';

export const fetchAdjustments = async (): Promise<AdjustmentLineItem[]> => {
  // Simulate network delay to be consistent with other services
  await new Promise(resolve => setTimeout(resolve, 500));
  const response = await fetch('/api/adjustments');
  if (!response.ok) {
    throw new Error('Failed to fetch adjustments from API');
  }
  return await response.json();
};

export const updateAdjustment = async (item: AdjustmentLineItem): Promise<AdjustmentLineItem> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await fetch(`/api/adjustments/${item.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        throw new Error('Failed to update adjustment via API');
    }

    return await response.json();
};