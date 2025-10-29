import { Order, OrderStatus, InventoryStatus, LineItem, PurchaseOrder, PurchaseOrderStatus, InventoryItem, AdjustmentLineItem, DocType, AdjustmentStatus } from './types';

const generateLineItems = (orderId: string): LineItem[] => {
  const items: { [key: string]: LineItem[] } = {
    'QB-84352': [
      { sku: 'WM-101', productName: 'Wireless Mouse', quantity: 1, location: 'A3-B2', stockStatus: InventoryStatus.InStock },
      { sku: 'KB-202', productName: 'Mechanical Keyboard', quantity: 1, location: 'A1-C5', stockStatus: InventoryStatus.InStock },
    ],
    'QB-84351': [{ sku: 'MON-303', productName: '27" 4K Monitor', quantity: 1, location: 'B2-A1', stockStatus: InventoryStatus.InStock }],
    'QB-84350': [
      { sku: 'LP-404', productName: 'Laptop Pro 16"', quantity: 2, location: 'C1-D3', stockStatus: InventoryStatus.InStock },
      { sku: 'ACC-505', productName: 'Laptop Stand', quantity: 2, location: 'E4-A2', stockStatus: InventoryStatus.OutOfStock },
    ],
    'QB-84349': [{ sku: 'HD-606', productName: 'Webcam HD', quantity: 1, location: 'A2-B4', stockStatus: InventoryStatus.InStock }],
    'QB-84348': [{ sku: 'SPK-707', productName: 'Bluetooth Speaker', quantity: 2, location: 'D3-C1', stockStatus: InventoryStatus.InStock }],
    'QB-84347': [{ sku: 'CHR-808', productName: 'Office Chair', quantity: 1, location: 'F1-A1', stockStatus: InventoryStatus.InStock }],
    'QB-84346': [{ sku: 'DSK-909', productName: 'Standing Desk', quantity: 1, location: 'F2-B3', stockStatus: InventoryStatus.InStock }],
    'QB-84345': [
      { sku: 'MIC-111', productName: 'USB Microphone', quantity: 1, location: 'A4-C2', stockStatus: InventoryStatus.InStock },
      { sku: 'POP-222', productName: 'Pop Filter', quantity: 1, location: 'A4-C2', stockStatus: InventoryStatus.InStock },
    ],
    'QB-84344': [{ sku: 'PRJ-333', productName: '4K Projector', quantity: 1, location: 'C3-A5', stockStatus: InventoryStatus.InStock }],
    'QB-84343': [{ sku: 'MOP-444', productName: 'Mouse Pad XL', quantity: 2, location: 'E1-B1', stockStatus: InventoryStatus.InStock }],
    'QB-84342': [{ sku: 'USB-555', productName: 'USB-C Hub', quantity: 1, location: 'A1-D4', stockStatus: InventoryStatus.InStock }],
    'QB-84341': [{ sku: 'SSD-666', productName: '1TB NVMe SSD', quantity: 3, location: 'B4-A3', stockStatus: InventoryStatus.InStock }],
  };
  return items[orderId] || [{ sku: 'N/A', productName: 'N/A', quantity: 1, location: 'N/A', stockStatus: InventoryStatus.OutOfStock }];
};

export const MOCK_ORDERS: Order[] = [
  { id: 'QB-84352', customerName: 'John Doe', orderDate: '2023-10-26', status: OrderStatus.Completed, totalAmount: 150.50, lineItems: generateLineItems('QB-84352') },
  { id: 'QB-84351', customerName: 'Jane Smith', orderDate: '2023-10-25', status: OrderStatus.Shipped, totalAmount: 200.00, lineItems: generateLineItems('QB-84351') },
  { id: 'QB-84350', customerName: 'Momentum Corp', orderDate: '2023-10-25', status: OrderStatus.Shipped, totalAmount: 1250.75, lineItems: generateLineItems('QB-84350') },
  { id: 'QB-84349', customerName: 'Alice Johnson', orderDate: '2023-10-24', status: OrderStatus.Pending, totalAmount: 75.20, lineItems: generateLineItems('QB-84349') },
  { id: 'QB-84348', customerName: 'Robert Brown', orderDate: '2023-10-22', status: OrderStatus.Completed, totalAmount: 300.00, lineItems: generateLineItems('QB-84348') },
  { id: 'QB-84347', customerName: 'Apex Innovations', orderDate: '2023-10-21', status: OrderStatus.Cancelled, totalAmount: 500.00, lineItems: generateLineItems('QB-84347') },
  { id: 'QB-84346', customerName: 'Emily White', orderDate: '2023-09-15', status: OrderStatus.Completed, totalAmount: 89.99, lineItems: generateLineItems('QB-84346') },
  { id: 'QB-84345', customerName: 'Michael Green', orderDate: '2023-09-12', status: OrderStatus.Completed, totalAmount: 450.00, lineItems: generateLineItems('QB-84345') },
  { id: 'QB-84344', customerName: 'Quantum Solutions', orderDate: '2023-09-10', status: OrderStatus.Pending, totalAmount: 2300.00, lineItems: generateLineItems('QB-84344') },
  { id: 'QB-84343', customerName: 'Sarah Black', orderDate: '2023-08-30', status: OrderStatus.Completed, totalAmount: 120.00, lineItems: generateLineItems('QB-84343') },
  { id: 'QB-84342', customerName: 'David King', orderDate: '2023-08-28', status: OrderStatus.Completed, totalAmount: 65.50, lineItems: generateLineItems('QB-84342') },
  { id: 'QB-84341', customerName: 'Innovate LLC', orderDate: '2023-08-15', status: OrderStatus.Shipped, totalAmount: 890.00, lineItems: generateLineItems('QB-84341') },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2023-001',
    supplier: 'Tech Supplies Inc.',
    orderDate: '2023-10-20',
    expectedDelivery: '2023-11-05',
    status: PurchaseOrderStatus.Receiving,
    items: [
      { sku: 'WM-101', productName: 'Wireless Mouse', quantityOrdered: 50, quantityReceived: 25 },
      { sku: 'KB-202', productName: 'Mechanical Keyboard', quantityOrdered: 30, quantityReceived: 10 },
    ],
  },
  {
    id: 'PO-2023-002',
    supplier: 'Component Hub',
    orderDate: '2023-10-22',
    expectedDelivery: '2023-11-10',
    status: PurchaseOrderStatus.Pending,
    items: [
      { sku: 'MON-303', productName: '27" 4K Monitor', quantityOrdered: 20, quantityReceived: 0 },
      { sku: 'SSD-666', productName: '1TB NVMe SSD', quantityOrdered: 100, quantityReceived: 0 },
    ],
  },
  {
    id: 'PO-2023-003',
    supplier: 'Office Essentials',
    orderDate: '2023-09-15',
    expectedDelivery: '2023-10-01',
    status: PurchaseOrderStatus.Received,
    items: [
      { sku: 'CHR-808', productName: 'Office Chair', quantityOrdered: 15, quantityReceived: 15 },
      { sku: 'DSK-909', productName: 'Standing Desk', quantityOrdered: 15, quantityReceived: 15 },
    ],
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { sku: 'WM-101', productName: 'Wireless Mouse', totalQuantity: 150, locations: [{ locationId: 'A3-B2', quantity: 150 }] },
  { sku: 'KB-202', productName: 'Mechanical Keyboard', totalQuantity: 75, locations: [{ locationId: 'A1-C5', quantity: 75 }] },
  { sku: 'MON-303', productName: '27" 4K Monitor', totalQuantity: 40, locations: [{ locationId: 'B2-A1', quantity: 40 }] },
  { sku: 'LP-404', productName: 'Laptop Pro 16"', totalQuantity: 25, locations: [{ locationId: 'C1-D3', quantity: 25 }] },
  { sku: 'ACC-505', productName: 'Laptop Stand', totalQuantity: 2, locations: [{ locationId: 'E4-A2', quantity: 2 }] },
  { sku: 'HD-606', productName: 'Webcam HD', totalQuantity: 200, locations: [{ locationId: 'A2-B4', quantity: 200 }] },
  { sku: 'SPK-707', productName: 'Bluetooth Speaker', totalQuantity: 88, locations: [{ locationId: 'D3-C1', quantity: 88 }] },
  { sku: 'CHR-808', productName: 'Office Chair', totalQuantity: 32, locations: [{ locationId: 'F1-A1', quantity: 32 }] },
  { sku: 'DSK-909', productName: 'Standing Desk', totalQuantity: 18, locations: [{ locationId: 'F2-B3', quantity: 18 }] },
  { sku: 'MIC-111', productName: 'USB Microphone', totalQuantity: 60, locations: [{ locationId: 'A4-C2', quantity: 60 }] },
  { sku: 'POP-222', productName: 'Pop Filter', totalQuantity: 60, locations: [{ locationId: 'A4-C2', quantity: 60 }] },
  { sku: 'PRJ-333', productName: '4K Projector', totalQuantity: 10, locations: [{ locationId: 'C3-A5', quantity: 10 }] },
  { sku: 'MOP-444', productName: 'Mouse Pad XL', totalQuantity: 120, locations: [{ locationId: 'E1-B1', quantity: 120 }] },
  { sku: 'USB-555', productName: 'USB-C Hub', totalQuantity: 150, locations: [{ locationId: 'A1-D4', quantity: 150 }] },
  { sku: 'SSD-666', productName: '1TB NVMe SSD', totalQuantity: 80, locations: [{ locationId: 'B4-A3', quantity: 80 }] },
];


const parseLocations = (description: string = ''): string[] => {
    const parts = description.split('@');
    if (parts.length > 1) {
      return parts[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};
  
const parseDescription = (description: string = ''): string => {
    return description.split('@')[0].trim();
};

const rawMockData = [
    { id: 'inv-1', date: '2023-10-26', type: 'Invoice' as DocType, docNumber: 'QB-84352', customer: 'John Doe', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse @ A3-B2, A3-B3', qty: 1, shippingTo: '123 Main St' },
    { id: 'inv-2', date: '2023-10-25', type: 'Invoice' as DocType, docNumber: 'QB-84350', customer: 'Momentum Corp', sku: 'LP-404', product: 'Laptop Pro 16"', description: 'Laptop Pro 16" @ C1-D3', qty: 2, shippingTo: '456 Corp Ave' },
    { id: 'sr-1', date: '2023-10-24', type: 'Sale Receipts' as DocType, docNumber: 'QB-SR-1120', customer: 'Alice Johnson', sku: 'HD-606', product: 'Webcam HD', description: 'Webcam HD @ A2-B4, A2-B5', qty: 1, shippingTo: '789 Tech Rd' },
    { id: 'cm-1', date: '2023-10-21', type: 'Credit Memo' as DocType, docNumber: 'QB-CM-205', customer: 'Apex Innovations', sku: 'WM-101', product: 'Wireless Mouse', description: 'Wireless Mouse (Return)', qty: 1, shippingTo: '101 Innovate Blvd' },
    { id: 'inv-3', date: '2023-10-20', type: 'Invoice' as DocType, docNumber: 'QB-84348', customer: 'Robert Brown', sku: 'SPK-707', product: 'Bluetooth Speaker', description: 'Bluetooth Speaker @ D3-C1', qty: 2, shippingTo: '21 Jump Street' },
];

export const MOCK_ADJUSTMENTS: AdjustmentLineItem[] = rawMockData.map((item, index) => ({
    id: String(index + 1),
    // FIX: Added missing properties to match the AdjustmentLineItem type.
    date: item.date,
    customer: item.customer,
    productName: item.product,
    docType: item.type,
    docNumber: item.docNumber,
    sku: item.sku,
    description: parseDescription(item.description),
    qty: item.qty,
    locations: parseLocations(item.description),
    selectedLocation: undefined,
    status: AdjustmentStatus.Unconfirmed,
}));
