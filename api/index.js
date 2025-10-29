const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// --- In-memory state for scraper simulation ---
// This state is now per-server instance, not per user session.
// In a real multi-user scenario, this would need a more robust solution like Redis.
// NOTE: browserOpen state is removed and now managed by the client, to support stateless environments.
let scraperState = {
    running: false,
    logs: [`[${new Date().toLocaleTimeString()}] Waiting for command...`],
};

const addLog = (message) => {
    const logMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(logMessage);
    scraperState.logs.push(logMessage);
};

const MOCK_DATA = {
    Invoice: [
        { id: 'inv-1', date: '2023-10-26', type: 'Invoice', docNumber: 'QB-84352', customer: 'John Doe', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse @ A3-B2, A3-B3', qty: -1, shippingTo: '123 Main St' },
        { id: 'inv-2', date: '2023-10-25', type: 'Invoice', docNumber: 'QB-84350', customer: 'Momentum Corp', sku: 'LP-404', product: 'Laptop Pro 16"', description: 'Laptop Pro 16" @ C1-D3', qty: -2, shippingTo: '456 Corp Ave' },
        { id: 'inv-3', date: '2023-10-20', type: 'Invoice', docNumber: 'QB-84348', customer: 'Robert Brown', sku: 'SPK-707', product: 'Bluetooth Speaker', description: 'Bluetooth Speaker @ D3-C1', qty: -2, shippingTo: '21 Jump Street' },
    ],
    'Sale Receipts': [
        { id: 'sr-1', date: '2023-10-24', type: 'Sale Receipts', docNumber: 'QB-SR-1120', customer: 'Alice Johnson', sku: 'HD-606', product: 'Webcam HD', description: 'Webcam HD @ A2-B4, A2-B5', qty: -1, shippingTo: '789 Tech Rd' },
        { id: 'sr-2', date: '2023-10-23', type: 'Sale Receipts', docNumber: 'QB-SR-1121', customer: 'David King', sku: 'MOP-444', product: 'Mouse Pad XL', description: 'Mouse Pad XL @ E1-B1', qty: -2, shippingTo: '321 Oak Ave' },
        { id: 'sr-3', date: '2023-10-22', type: 'Sale Receipts', docNumber: 'QB-SR-1122', customer: 'Emily White', sku: 'USB-555', product: 'USB-C Hub', description: 'USB-C Hub @ A1-D4, A1-D5', qty: -1, shippingTo: '654 Pine St' },
    ],
    'Credit Memo': [
        { id: 'cm-1', date: '2023-10-21', type: 'Credit Memo', docNumber: 'QB-CM-205', customer: 'Apex Innovations', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse (Return)', qty: 1, shippingTo: '101 Innovate Blvd' },
        { id: 'cm-2', date: '2023-10-20', type: 'Credit Memo', docNumber: 'QB-CM-206', customer: 'Momentum Corp', sku: 'ACC-505', product: 'Laptop Stand', description: 'Defective stand return', qty: 2, shippingTo: '456 Corp Ave' },
        { id: 'cm-3', date: '2023-10-19', type: 'Credit Memo', docNumber: 'QB-CM-207', customer: 'John Doe', sku: 'KB-202', product: 'Mechanical Keyboard', description: 'Wrong model sent, return', qty: 1, shippingTo: '123 Main St' },
    ],
    Estimate: [
        { id: 'est-1', date: '2023-11-01', type: 'Estimate', docNumber: 'QB-EST-101', customer: 'Future Gadgets', sku: 'PRJ-333', product: '4K Projector', description: 'Projector for conference room @ C3-A5', qty: 1, shippingTo: '555 Future Drive' },
        { id: 'est-2', date: '2023-11-02', type: 'Estimate', docNumber: 'QB-EST-102', customer: 'Quantum Solutions', sku: 'DSK-909', product: 'Standing Desk', description: 'Quote for 10 desks for new office', qty: 10, shippingTo: '987 Quantum Way' },
        { id: 'est-3', date: '2023-11-03', type: 'Estimate', docNumber: 'QB-EST-103', customer: 'Innovate LLC', sku: 'CHR-808', product: 'Office Chair', description: 'Office chairs, bulk order estimate @ F1-A1', qty: 20, shippingTo: '444 Innovate Lane' },
    ],
};

const parseLocations = (description = '') => {
    const parts = description.split('@');
    if (parts.length > 1) {
      return parts[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};
  
const parseDescription = (description = '') => {
    return description.split('@')[0].trim();
};

const simulateFetchAndSave = (docType) => {
    (async () => {
        try {
            // Shortened delays to ensure completion in a serverless environment
            await new Promise(r => setTimeout(r, 100));

            // Step 1: Load existing document numbers from Supabase to avoid duplicates
            addLog(`🔍 Loading existing ${docType} NOs from database to skip...`);
            const { data: existingRecords, error: fetchError } = await supabase
                .from('qbo_synced_data')
                .select('doc_number')
                .eq('doc_type', docType);
            
            if (fetchError) throw new Error(`Supabase query failed: ${fetchError.message}`);

            const existingNos = new Set(existingRecords.map(item => item.doc_number));
            addLog(`ℹ️ Loaded ${existingNos.size} existing document number(s). These will be skipped.`);
            
            await new Promise(r => setTimeout(r, 200));

            // Step 2: Get all mock items for the docType
            const allMockItems = MOCK_DATA[docType] || [];
            addLog(`ℹ️ Detected ${allMockItems.length} record(s) on the page for ${docType}.`);
            await new Promise(r => setTimeout(r, 100));

            // Step 3: Loop through each item and process it if it's new
            let newItemsFound = 0;
            for (const [index, item] of allMockItems.entries()) {
                const logPrefix = `[${index + 1}/${allMockItems.length}]`;
                
                if (existingNos.has(item.docNumber)) {
                    addLog(`${logPrefix} ⏭️ Skipping document ${item.docNumber} (already exists).`);
                    await new Promise(r => setTimeout(r, 50)); // Short delay for skipped items
                    continue;
                }

                newItemsFound++;
                addLog(`${logPrefix} 👉 Processing NO=${item.docNumber}, DATE=${item.date}, CUSTOMER=${item.customer}`);
                
                // Simulate navigating to details page
                addLog(`    - Clicking details, waiting for line items to load...`);
                await new Promise(r => setTimeout(r, 300));
                
                addLog(`    - Document ${item.docNumber} details collected. 1 line item(s) found.`);

                const itemToInsert = {
                    doc_date: item.date,
                    doc_type: item.type,
                    doc_number: item.docNumber,
                    customer: item.customer,
                    sku: item.sku,
                    product: item.product,
                    description: parseDescription(item.description),
                    full_description: item.description,
                    qty: item.qty,
                    shipping_to: item.shippingTo,
                    locations: parseLocations(item.description),
                    status: 'Unconfirmed',
                };

                // Simulate saving to DB
                const { error } = await supabase
                    .from('qbo_synced_data')
                    .insert([itemToInsert])
                    .select();

                if (error) {
                    addLog(`    - 🔴 Supabase Error for ${item.docNumber}: ${error.message}`);
                } else {
                    addLog(`    - ✅ Document ${item.docNumber} details processed and saved to database.`);
                }
                
                // Simulate navigating back to list page
                addLog(`    - Returned to list page.`);
                await new Promise(r => setTimeout(r, 300));
            }

            if (newItemsFound > 0) {
                 addLog(`✅ Successfully fetched and saved ${newItemsFound} new item(s).`);
            } else {
                 addLog(`ℹ️ No new items found for ${docType}. Nothing to do.`);
            }

        } catch(err) {
            addLog(`🔴 An error occurred during fetch: ${err.message}`);
        } finally {
            addLog('🎉 Fetch complete.');
            scraperState.running = false;
        }
    })();
};

router.post('/selenium/control', async (req, res) => {
    const { command, docType } = req.body;

    const sendStatus = () => {
        // The `browserOpen` flag is now controlled by the client's state.
        // We always return `true` if any command other than reset is called, assuming the client manages this flow.
        const isBrowserConsideredOpen = command !== 'reset';
        res.json({
            browserOpen: isBrowserConsideredOpen,
            running: scraperState.running,
            logs: scraperState.logs,
        });
    };

    switch (command) {
        case 'open':
            scraperState.logs = []; // Clear logs for new session
            addLog('🌐 Simulating browser open...');
            addLog('✅ Ready. Please login to QuickBooks Online via the new tab, then start a fetch.');
            res.json({
                browserOpen: true, // Tell the frontend the browser is ready
                running: scraperState.running,
                logs: scraperState.logs,
            });
            break;
        case 'start_fetch':
            // Removed browserOpen check to support stateless server environments.
            // The UI flow on the client prevents this from being called improperly.
            if (scraperState.running) return res.status(400).json({ message: 'A fetch operation is already in progress.' });
            
            scraperState.running = true;
            scraperState.logs = []; // Clear logs for new fetch
            addLog(`🚀 Starting fetch for ${docType}...`);
            simulateFetchAndSave(docType); // Fire and forget
            sendStatus();
            break;
        case 'status':
            sendStatus();
            break;
        case 'reset':
            scraperState.running = true; // Prevent other operations during reset
            scraperState.logs = []; // Clear logs for the reset process
            addLog('🔄 Resetting scraper state and clearing database...');
            try {
                const { error } = await supabase.from('qbo_synced_data').delete().neq('id', 0); // delete all
                if (error) {
                    throw error;
                }
                addLog('✅ Database cleared successfully.');
            } catch (err) {
                addLog(`🔴 Database reset failed: ${err.message}`);
            }
            
            // Reset in-memory state
            scraperState.running = false;
            scraperState.logs.push(`[${new Date().toLocaleTimeString()}] Waiting for command...`);
            addLog('🔄 Scraper state has been reset.');
        
            res.json({
                browserOpen: false, // Resetting "closes" the browser
                running: scraperState.running,
                logs: scraperState.logs,
            });
            break;
        default:
            return res.status(400).json({ message: 'Invalid command.' });
    }
});


// --- Data Export Endpoint ---
const escapeCsvField = (field) => {
    const strField = String(field ?? '');
    // If the field contains a comma, a double quote, or a newline, enclose it in double quotes.
    if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
        // Also, any double quotes within the field must be escaped by another double quote.
        return `"${strField.replace(/"/g, '""')}"`;
    }
    return strField;
};

router.get('/export_csv', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('qbo_synced_data')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Supabase query failed: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
            return res.status(404).send('No data available to export.');
        }

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => escapeCsvField(row[header]));
            csvRows.push(values.join(','));
        }
        
        const csvString = csvRows.join('\n');

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="qbo_export_${dateStr}.csv"`);
        res.status(200).send(csvString);

    } catch (e) {
        console.error('CSV Export Error:', e);
        res.status(500).send('Failed to export data.');
    }
});


// --- Data Fetching API Endpoints ---

// Fetch Synced Data for QBO Sync Page
router.get('/synced_data', async (req, res) => {
    const { data, error } = await supabase
        .from('qbo_synced_data')
        .select('*')
        .order('doc_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    // Map to frontend type
    const formattedData = data.map(item => ({
        id: item.id.toString(),
        date: item.doc_date,
        type: item.doc_type,
        docNumber: item.doc_number,
        customer: item.customer,
        sku: item.sku,
        product: item.product,
        description: item.description,
        qty: item.qty,
        shippingTo: item.shipping_to,
    }));
    res.json(formattedData);
});

// Fetch Orders for Dashboard/Outbound
router.get('/orders', async (req, res) => {
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

    if (error) return res.status(500).json({ error: error.message });
    
    // Map to frontend camelCase format
    const formattedData = data.map(order => ({
        id: order.id,
        customerName: order.customer_name,
        orderDate: order.order_date,
        status: order.status,
        totalAmount: order.total_amount,
        lineItems: order.order_line_items.map(item => ({
            sku: item.sku,
            productName: item.product_name,
            quantity: item.quantity,
            location: item.location,
            stockStatus: item.stock_status,
        }))
    }));

    res.json(formattedData);
});

// Update Order Status
router.put('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Fetch Purchase Orders for Inbound
router.get('/purchase_orders', async (req, res) => {
     const { data, error } = await supabase
        .from('purchase_orders')
        .select(`*, po_line_items(*)`)
        .order('order_date', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    const formattedData = data.map(po => ({
        id: po.id,
        supplier: po.supplier,
        orderDate: po.order_date,
        expectedDelivery: po.expected_delivery,
        status: po.status,
        items: po.po_line_items.map(item => ({
            sku: item.sku,
            productName: item.product_name,
            quantityOrdered: item.quantity_ordered,
            quantityReceived: item.quantity_received,
        }))
    }));
    res.json(formattedData);
});

// Update Purchase Order
router.put('/purchase_orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status, items } = req.body; // items contain updated received quantities

    // In a real app, this would be a transaction
    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id);

    if (poError) return res.status(500).json({ error: poError.message });

    for (const item of items) {
        const { error: itemError } = await supabase
            .from('po_line_items')
            .update({ quantity_received: item.quantityReceived })
            .eq('po_id', id)
            .eq('sku', item.sku);

        if (itemError) console.error(`Failed to update item ${item.sku}: ${itemError.message}`);
    }

    res.json({ success: true });
});


// Fetch Inventory
router.get('/inventory', async (req, res) => {
    const { data, error } = await supabase
        .from('inventory')
        .select(`*, inventory_locations(*)`);

    if (error) return res.status(500).json({ error: error.message });
    
    const formattedData = data.map(item => ({
        sku: item.sku,
        productName: item.product_name,
        totalQuantity: item.total_quantity,
        locations: item.inventory_locations.map(loc => ({
            locationId: loc.location_id,
            quantity: loc.quantity
        }))
    }));
    res.json(formattedData);
});

// Update Inventory Stock
router.put('/inventory/:sku', async (req, res) => {
    const { sku } = req.params;
    const { totalQuantity } = req.body;
    const { data, error } = await supabase
        .from('inventory')
        .update({ total_quantity: totalQuantity })
        .eq('sku', sku)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Fetch Adjustments (from qbo_synced_data)
router.get('/adjustments', async (req, res) => {
    const { data, error } = await supabase
      .from('qbo_synced_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    // Map to frontend type
    const formattedData = data.map(item => ({
        id: item.id.toString(),
        docType: item.doc_type,
        docNumber: item.doc_number,
        sku: item.sku,
        description: item.description,
        fullDescription: item.full_description,
        qty: item.qty,
        locations: item.locations || [],
        selectedLocation: item.selected_location || '',
        status: item.status,
    }));
    res.json(formattedData);
});


// Update/Lock/Unlock Adjustments
router.put('/adjustments/:id', async (req, res) => {
    const { id } = req.params;
    const { sku, description, qty, selectedLocation, status } = req.body;

    const { data, error } = await supabase
        .from('qbo_synced_data')
        .update({ sku, description, qty, selected_location: selectedLocation, status })
        .eq('id', id)
        .select()
        .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


const app = express();
app.use(express.json());
app.use(router);

module.exports = app;