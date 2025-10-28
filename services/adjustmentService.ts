import { DocType, AdjustmentLineItem, AdjustmentStatus } from '../types';

interface RawAdjustmentItem {
    id: string;
    docType: DocType;
    docNumber: string;
    sku: string;
    description: string;
    fullDescription?: string;
    qty: number;
    locations: string[];
}

export const fetchAdjustmentData = async (docType: DocType): Promise<AdjustmentLineItem[]> => {
    console.log(`Fetching adjustment data for ${docType} from server...`);
    try {
        const response = await fetch(`/api/adjustment-docs?docType=${encodeURIComponent(docType)}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch data from the server.' }));
            if (response.status === 401 || response.status === 503) {
                // 401 is for expired tokens, 503 can be for uninitialized client
                throw new Error('QuickBooks Online connection required. Please connect from the Outbound page.');
            }
            throw new Error(errorData.message || `Server responded with status ${response.status}`);
        }

        const rawItems: RawAdjustmentItem[] = await response.json();

        const processedItems: AdjustmentLineItem[] = rawItems.map(item => ({
            ...item,
            selectedLocation: item.locations[0] || undefined,
            status: AdjustmentStatus.Unconfirmed,
        }));
        
        console.log(`Successfully fetched and processed adjustment data for ${docType}.`);
        return processedItems;

    } catch (error: any) {
        console.error(`Error fetching adjustment data for ${docType}:`, error);
        throw error;
    }
};
