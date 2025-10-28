import { AdjustmentLineItem } from '../types';
import { MOCK_ADJUSTMENTS } from '../constants';

// Create a mutable copy for in-session persistence
let sessionAdjustments: AdjustmentLineItem[] = JSON.parse(JSON.stringify(MOCK_ADJUSTMENTS));


export const fetchAdjustments = async (): Promise<AdjustmentLineItem[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return the session's copy of the data
  return Promise.resolve(sessionAdjustments);
};

export const updateAdjustment = async (item: AdjustmentLineItem): Promise<AdjustmentLineItem> => {
    // Simulate a successful API call and update the in-memory store
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const itemIndex = sessionAdjustments.findIndex((adj: AdjustmentLineItem) => adj.id === item.id);
    
    if (itemIndex !== -1) {
        sessionAdjustments[itemIndex] = item;
    } else {
        // This case shouldn't happen in the current flow, but is good practice
        sessionAdjustments.push(item);
    }

    return Promise.resolve(item);
};
