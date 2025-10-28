require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const { Issuer } = require('openid-client');
const QuickBooks = require('node-quickbooks');

const app = express();
const port = process.env.PORT || 3001;

// --- Vercel-Safe Configuration ---
const determineBaseUrl = () => {
  // Use the production URL if available (for custom domains and consistent production URLs)
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // Otherwise, use the preview deployment URL provided by Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development
  return `http://localhost:${port}`;
};

const BASE_URL = determineBaseUrl();

// The frontend URL in this setup is the same as the backend base URL when deployed.
// We keep the logic for a separate FRONTEND_URL to maintain flexibility for local development.
const FRONTEND_URL = process.env.VERCEL_URL ? BASE_URL : (process.env.FRONTEND_URL || 'http://localhost:5173');


app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json()); // Enable JSON body parsing for POST requests
app.use(cookieSession({
  name: 'wms-pro-session',
  secret: process.env.SESSION_SECRET || 'a-very-secret-key-for-wms-pro-app',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 // 24 hours
}));

// --- Vercel-Safe Asynchronous Initialization ---
let intuitClient;
let initializationError = null;

const initializeClient = async () => {
    try {
        const redirectUri = `${BASE_URL}/callback`;
        if (!process.env.QBO_CLIENT_ID || !process.env.QBO_CLIENT_SECRET) {
            initializationError = `Your QuickBooks Client ID and Secret are not configured. Also, ensure the redirect URI in your QBO App settings is set to: ${redirectUri}`;
            console.error(`Initialization Error: Missing QBO credentials.`);
            return;
        }
        const issuer = await Issuer.discover(QuickBooks.discovery_uri_production);
        intuitClient = new issuer.Client({
            client_id: process.env.QBO_CLIENT_ID,
            client_secret: process.env.QBO_CLIENT_SECRET,
            redirect_uris: [redirectUri],
            response_types: ['code'],
        });
    } catch (err) {
        console.error("Failed to initialize QuickBooks client:", err);
        initializationError = err.message || "Could not connect to QuickBooks services. Please check server logs.";
    }
};

initializeClient();


const checkInitialization = (req, res, next) => {
    if (initializationError) {
        // For direct browser navigation to /auth or /callback, redirect with an error message.
        if (req.accepts('html')) {
            const encodedError = encodeURIComponent(initializationError);
            const encodedAction = encodeURIComponent("Go to your Vercel Project Settings > Environment Variables and set QBO_CLIENT_ID, QBO_CLIENT_SECRET, and a secure SESSION_SECRET. Also, verify the redirect URI in your Intuit Developer Portal matches the one mentioned in the error message.");
            return res.redirect(`${FRONTEND_URL}?view=outbound&error=${encodedError}&action=${encodedAction}`);
        }
        // For API calls, return a JSON error.
        return res.status(503).json({
            error: "Server Configuration Error",
            message: initializationError,
            action: "Check environment variables and QBO app configuration."
        });
    }
    if (!intuitClient) {
        return res.status(503).json({ error: "OAuth client is not ready. The server may be starting up, please try again in a moment." });
    }
    next();
};

// --- Routes ---

app.get('/auth', checkInitialization, (req, res) => {
  const authUrl = intuitClient.authorizationUrl({
    scope: 'com.intuit.quickbooks.accounting',
    state: 'from-wms-pro-app',
  });
  res.redirect(authUrl);
});

app.get('/callback', checkInitialization, async (req, res) => {
  try {
    const params = intuitClient.callbackParams(req);
    const tokenSet = await intuitClient.callback(`${BASE_URL}/callback`, params, { state: 'from-wms-pro-app' });
    req.session.tokenSet = tokenSet;
    req.session.realmId = req.query.realmId;
    res.redirect(`${FRONTEND_URL}?view=outbound`);
  } catch (err) {
    console.error('Error during OAuth callback:', err);
    res.status(500).send('Authentication failed. Please try connecting again.');
  }
});

app.get('/api/status', (req, res) => {
  const isConnected = !!req.session.tokenSet && req.session.tokenSet.expires_at > (Date.now() / 1000);
  res.json({ isConnected });
});

const createQboInstance = (tokenSet, realmId) => {
    return new QuickBooks(
      process.env.QBO_CLIENT_ID, process.env.QBO_CLIENT_SECRET, tokenSet.access_token,
      false, realmId, false, false, null, '2.0', tokenSet.refresh_token
    );
};

const ensureValidToken = async (req, res, next) => {
  if (!req.session.tokenSet || !req.session.realmId) {
    return res.status(401).json({ error: 'Not authenticated. Please connect to QBO.' });
  }
  let tokenSet = req.session.tokenSet;
  if (tokenSet.expires_at < (Date.now() / 1000) + 60) {
    try {
      const newTokens = await intuitClient.refresh(tokenSet.refresh_token);
      req.session.tokenSet = newTokens;
      tokenSet = newTokens;
    } catch (err) {
      req.session = null; // Clear the session cookie
      return res.status(401).json({ error: 'Session expired. Please connect to QBO again.' });
    }
  }
  req.qbo = createQboInstance(tokenSet, req.session.realmId);
  next();
};

const formatOrders = (receipts) => (receipts || []).map(r => ({
    id: `QB-${r.DocNumber || r.Id}`, customerName: r.CustomerRef.name, orderDate: r.TxnDate,
    status: 'Pending', totalAmount: r.TotalAmt,
    lineItems: (r.Line || []).map(line => line.SalesItemLineDetail?.ItemRef ? {
        sku: line.SalesItemLineDetail.ItemRef.name || 'N/A-SKU',
        productName: line.Description || line.SalesItemLineDetail.ItemRef.name || 'N/A-Product',
        quantity: line.SalesItemLineDetail.Qty || 0, location: 'TBD', stockStatus: 'In Stock',
    } : null).filter(Boolean)
}));

app.get('/api/orders', checkInitialization, ensureValidToken, (req, res) => {
  req.qbo.findSalesReceipts({ limit: 25, sort: 'TxnDate desc' }, (err, apiResponse) => {
    if (err) return res.status(500).json({ error: 'An error occurred while fetching data from QuickBooks.' });
    const formattedOrders = formatOrders(apiResponse.QueryResponse.SalesReceipt);
    res.json(formattedOrders);
  });
});

const formatPurchaseOrders = (pos) => (pos || []).map(po => {
    const isClosed = po.POStatus === 'Closed';
    const items = (po.Line || []).map(line => {
      if (!line.ItemBasedExpenseLineDetail?.ItemRef) return null;
      const ordered = line.ItemBasedExpenseLineDetail.Qty || 0;
      return {
        sku: line.ItemBasedExpenseLineDetail.ItemRef.name,
        productName: line.Description || line.ItemBasedExpenseLineDetail.ItemRef.name,
        quantityOrdered: ordered,
        quantityReceived: isClosed ? ordered : 0, // Simplified logic: if PO is closed, all items are received.
      }
    }).filter(Boolean);

    return {
        id: `PO-${po.DocNumber || po.Id}`,
        supplier: po.VendorRef.name,
        orderDate: po.TxnDate,
        expectedDelivery: po.DueDate,
        status: isClosed ? 'Received' : 'Pending', // Maps to PurchaseOrderStatus enum
        items: items,
    }
});

app.get('/api/purchase-orders', checkInitialization, ensureValidToken, (req, res) => {
  req.qbo.findPurchaseOrders({ limit: 25, sort: 'TxnDate desc' }, (err, apiResponse) => {
    if (err) return res.status(500).json({ error: 'An error occurred while fetching purchase orders from QuickBooks.' });
    const formattedPOs = formatPurchaseOrders(apiResponse.QueryResponse.PurchaseOrder);
    res.json(formattedPOs);
  });
});

const parseLocationsFromDescription = (description) => {
    if (!description || !description.includes('@')) {
        return [];
    }
    const parts = description.split('@');
    return parts[1].split('*').map(l => l.trim()).filter(l => l);
};

const formatInventory = (items) => (items || []).map(item => {
    const locations = parseLocationsFromDescription(item.Description);
    const stockLocations = [];
    if (locations.length > 0) {
        // Simplified logic: Assign all stock to the first location parsed from the description.
        stockLocations.push({ locationId: locations[0], quantity: item.QtyOnHand || 0 });
        // Add other potential locations with 0 quantity just to show they exist.
        for (let i = 1; i < locations.length; i++) {
            stockLocations.push({ locationId: locations[i], quantity: 0 });
        }
    }

    return {
        sku: item.Name,
        productName: item.Description ? item.Description.split('@')[0].trim() : item.Name,
        totalQuantity: item.QtyOnHand || 0,
        locations: stockLocations,
    }
});

app.get('/api/inventory', checkInitialization, ensureValidToken, (req, res) => {
  req.qbo.findItems({ limit: 100, Active: true, Type: 'Inventory' }, (err, apiResponse) => {
    if (err) return res.status(500).json({ error: 'An error occurred while fetching inventory from QuickBooks.' });
    const formattedInventory = formatInventory(apiResponse.QueryResponse.Item);
    res.json(formattedInventory);
  });
});

const parseDescriptionForAdjustment = (description) => {
    if (!description) {
        return { desc: '', locations: [] };
    }
    const parts = description.split('@');
    if (parts.length < 2) {
        return { desc: description, locations: [] };
    }
    const desc = parts[0].trim();
    const locations = parts[1].split('*').map(l => l.trim()).filter(l => l);
    return { desc, locations };
};

const formatDocsForAdjustment = (docs, docType) => {
  const allItems = [];
  (docs || []).forEach(doc => (doc.Line || []).forEach((line, index) => {
    if (line.SalesItemLineDetail?.ItemRef) {
      const { desc, locations } = parseDescriptionForAdjustment(line.Description);
      allItems.push({
        id: `qbo-${docType.replace(/\s+/g, '')}-${doc.Id}-${line.Id || index}`,
        docType: docType,
        docNumber: doc.DocNumber || doc.Id,
        sku: line.SalesItemLineDetail.ItemRef.name || 'N/A-SKU',
        description: desc,
        fullDescription: line.Description || '',
        qty: line.SalesItemLineDetail.Qty || 0,
        locations: locations,
      });
    }
  }));
  return allItems;
};

app.get('/api/adjustment-docs', checkInitialization, ensureValidToken, (req, res) => {
  const { docType } = req.query;
  if (!docType) {
    return res.status(400).json({ error: 'docType query parameter is required.' });
  }

  const qboFinderMap = {
    'Invoice': 'findInvoices',
    'Sale Receipts': 'findSalesReceipts',
    'Credit Memo': 'findCreditMemos',
    'Estimate': 'findEstimates'
  };

  const finderMethodName = qboFinderMap[docType];
  if (!finderMethodName || typeof req.qbo[finderMethodName] !== 'function') {
      return res.status(400).json({ error: `Invalid docType: ${docType}` });
  }
  
  const qboResponseKeyMap = {
      'Invoice': 'Invoice',
      'Sale Receipts': 'SalesReceipt',
      'Credit Memo': 'CreditMemo',
      'Estimate': 'Estimate'
  };

  req.qbo[finderMethodName]({ limit: 15, sort: 'TxnDate desc' }, (err, apiResponse) => {
    if (err) {
      console.error(`Error fetching ${docType} from QBO:`, err);
      return res.status(500).json({ error: `An error occurred while fetching ${docType} from QuickBooks.` });
    }
    const responseKey = qboResponseKeyMap[docType];
    const docs = apiResponse.QueryResponse ? apiResponse.QueryResponse[responseKey] : [];
    const formattedItems = formatDocsForAdjustment(docs, docType);
    res.json(formattedItems);
  });
});

app.post('/api/update-item', checkInitialization, ensureValidToken, async (req, res) => {
  const { sku, newDescription } = req.body;
  if (!sku || newDescription === undefined) {
    return res.status(400).json({ error: 'SKU and newDescription are required.' });
  }

  try {
    // 1. Find the item by SKU (which is the 'Name' field in QBO)
    req.qbo.findItems({ Name: sku }, (findErr, findResponse) => {
      if (findErr || !findResponse.QueryResponse.Item || findResponse.QueryResponse.Item.length === 0) {
        console.error('Error finding item or item not found for SKU:', sku, findErr);
        return res.status(404).json({ error: `Item with SKU '${sku}' not found in QuickBooks.` });
      }
      
      const itemToUpdate = findResponse.QueryResponse.Item[0];
      
      // 2. Prepare the update payload
      const updatePayload = {
        Id: itemToUpdate.Id,
        SyncToken: itemToUpdate.SyncToken,
        sparse: true, // Important: only update the fields you provide
        Description: newDescription,
        Name: itemToUpdate.Name, // Name is required for updates
        Type: itemToUpdate.Type, // Type is required for updates
      };

      // 3. Update the item
      req.qbo.updateItem(updatePayload, (updateErr, updatedItem) => {
        if (updateErr) {
          console.error('Error updating item in QBO:', updateErr.fault ? updateErr.fault.error[0] : updateErr);
          return res.status(500).json({ error: 'Failed to update item in QuickBooks.' });
        }
        res.status(200).json({ success: true, updatedItem });
      });
    });
  } catch (e) {
    console.error('Server-side exception while updating item:', e);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});


if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Backend server running on http://localhost:${port}`));
}

module.exports = app;