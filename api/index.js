const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// --- In-memory state for scraper simulation ---
// This state is now per-server instance, not per user session.
// In a real multi-user scenario, this would need a more robust solution like Redis.
let scraperState = {
    browserOpen: false,
    running: false,
    logs: [`[${new Date().toLocaleTimeString()}] Waiting for command...`],
};

const addLog = (message) => {
    const logMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(logMessage);
    scraperState.logs.push(logMessage);
};

const resetState = () => {
    scraperState = {
        browserOpen: false,
        running: false,
        logs: [`[${new Date().toLocaleTimeString()}] Waiting for command...`],
    };
    addLog('🔄 Scraper state has been reset.');
};

const MOCK_DATA = {
    Invoice: [
        { id: 'inv-1', date: '2023-10-26', type: 'Invoice', docNumber: 'QB-84352', customer: 'John Doe', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse @ A3-B2, A3-B3', qty: -1, shippingTo: '123 Main St' },
        { id: 'inv-2', date: '2023-10-25', type: 'Invoice', docNumber: 'QB-84350', customer: 'Momentum Corp', sku: 'LP-404', product: 'Laptop Pro 16"', description: 'Laptop Pro 16" @ C1-D3', qty: -2, shippingTo: '456 Corp Ave' },
        { id: 'inv-3', date: '2023-10-20', type: 'Invoice', docNumber: 'QB-84348', customer: 'Robert Brown', sku: 'SPK-707', product: 'Bluetooth Speaker', description: 'Bluetooth Speaker @ D3-C1', qty: -2, shippingTo: '21 Jump Street' },
    ],
    'Sale Receipts': [
        { id: 'sr-1', date: '2023-10-24', type: 'Sale Receipts', docNumber: 'QB-SR-1120', customer: 'Alice Johnson', sku: 'HD-606', product: 'Webcam HD', description: 'Webcam HD @ A2-B4, A2-B5', qty: -1, shippingTo: '789 Tech Rd' },
    ],
    'Credit Memo': [
        { id: 'cm-1', date: '2023-10-21', type: 'Credit Memo', docNumber: 'QB-CM-205', customer: 'Apex Innovations', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse (Return)', qty: 1, shippingTo: '101 Innovate Blvd' },
    ],
    Estimate: [
        { id: 'est-1', date: '2023-11-01', type: 'Estimate', docNumber: 'QB-EST-101', customer: 'Future Gadgets', sku: 'PRJ-333', product: '4K Projector', description: 'Projector for conference room @ C3-A5', qty: 1, shippingTo: '555 Future Drive' },
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

const simulateFetchAndSave = async (docType) => {
    addLog(`🚀 Starting fetch for ${docType}...`);
    
    try {
        // Step 1: Load existing document numbers from Supabase to avoid duplicates
        addLog(`🔍 Checking for existing ${docType} records in the database...`);
        const { data: existingRecords, error: fetchError } = await supabase
            .from('qbo_synced_data')
            .select('doc_number')
            .eq('doc_type', docType);
        
        if (fetchError) {
            throw new Error(`Supabase query failed: ${fetchError.message}`);
        }

        const existingNos = new Set(existingRecords.map(item => item.doc_number));
        addLog(`ℹ️ Found ${existingNos.size} existing document(s). These will be skipped.`);
        
        await new Promise(r => setTimeout(r, 1000)); // Simulate network latency

        // Step 2: Filter mock data to get only new items
        const allMockItems = MOCK_DATA[docType] || [];
        const newItemsToFetch = allMockItems.filter(item => !existingNos.has(item.docNumber));
        
        if (newItemsToFetch.length > 0) {
            addLog(`✅ Successfully fetched ${newItemsToFetch.length} new item(s).`);
            addLog('💾 Writing new data to Supabase...');
            await new Promise(r => setTimeout(r, 1500)); // Simulate writing delay

            const itemsToInsert = newItemsToFetch.map(item => ({
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
            }));

            const { data, error } = await supabase
                .from('qbo_synced_data')
                .insert(itemsToInsert)
                .select();

            if (error) {
                addLog(`🔴 Supabase Error: ${error.message}`);
            } else {
                addLog(`✅ Successfully saved ${data.length} new records to the database.`);
            }
        } else {
            addLog(`ℹ️ No new items found for ${docType}.`);
        }
    } catch(err) {
        addLog(`🔴 An error occurred during fetch: ${err.message}`);
    } finally {
        addLog('🎉 Fetch complete.');
        scraperState.running = false;
    }
};

router.post('/selenium/control', (req, res) => {
    const { command, docType } = req.body;

    const sendResponse = () => {
        res.json({
            browserOpen: scraperState.browserOpen,
            running: scraperState.running,
            logs: scraperState.logs,
        });
    };

    switch (command) {
        case 'open':
            if (!scraperState.browserOpen) {
                addLog('🌐 Opening browser...');
                scraperState.browserOpen = true;
                addLog('✅ Chrome browser opened. Please login to QuickBooks Online.');
            } else {
                addLog('ℹ️ Browser is already open.');
            }
            sendResponse();
            break;
        case 'start_fetch':
            if (!scraperState.browserOpen) return res.status(400).json({ message: 'Browser is not open.' });
            if (scraperState.running) return res.status(400).json({ message: 'A fetch operation is already in progress.' });
            
            scraperState.running = true;
            scraperState.logs = []; // Clear logs for new fetch
            simulateFetchAndSave(docType); // Fire and forget
            sendResponse();
            break;
        case 'status':
            sendResponse();
            break;
        case 'reset':
            resetState();
            sendResponse();
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