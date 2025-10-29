
const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');

// NOTE: All Selenium simulation logic has been REMOVED from this file.
// The new `agent.py` running on the user's local machine now handles all Selenium tasks.
// This backend file is now just a standard API server for data operations.

// --- Data Export Endpoint ---
const escapeCsvField = (field) => {
    const strField = String(field ?? '');
    if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
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

// This endpoint is no longer needed as the agent communicates directly with Supabase
// but can be kept for other purposes if required.
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
        qty: Math.abs(item.qty),
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
    
    const formattedData = data.map(item => {
        const rawDescription = item.description || '';
        const descriptionParts = rawDescription.split('@');
        const cleanDescription = descriptionParts[0].trim();
        const locations = descriptionParts.length > 1 
            ? descriptionParts[1].split(',').map(s => s.trim()).filter(Boolean) 
            : [];

        return {
            id: item.id.toString(),
            docType: item.doc_type,
            docNumber: item.doc_number,
            sku: item.sku,
            description: cleanDescription,
            qty: Math.abs(item.qty),
            locations: locations,
            selectedLocation: item.selected_location || '',
            status: item.status,
        };
    });
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
// Allow all CORS requests for simplicity in this architecture
const cors = require('cors');
app.use(cors());
app.use(router);

module.exports = app;