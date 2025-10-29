export enum OrderStatus {
  Completed = '已完成',
  Pending = '待处理',
  Picking = '拣货中',
  Packing = '打包中',
  Shipped = '已发货',
  Cancelled = '已取消',
}

export enum PurchaseOrderStatus {
  Pending = '待审核',
  Receiving = '收货中',
  Received = '已收货',
}

export enum InventoryStatus {
  InStock = '有货',
  OutOfStock = '缺货',
}

export enum AdjustmentStatus {
  Confirmed = 'Confirmed',
  Unconfirmed = 'Unconfirmed',
}

export type DocType = 'Invoice' | 'Sale Receipts' | 'Credit Memo' | 'Estimate';


export interface LineItem {
  sku: string;
  productName: string;
  quantity: number;
  location: string;
  stockStatus: InventoryStatus;
}

export interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  lineItems: LineItem[];
}

export interface PurchaseOrderLineItem {
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderLineItem[];
}

export interface StockLocation {
  locationId: string; // e.g., "A3-B2"
  quantity: number;
}

export interface InventoryItem {
  sku: string;
  productName: string;
  totalQuantity: number;
  locations: StockLocation[];
}

export interface AdjustmentLineItem {
  id: string; // Unique ID for the line item
  date: string;
  customer: string;
  productName: string;
  docType: DocType;
  docNumber: string;
  sku: string;
  description: string; // The part of the description before '@'
  qty: number;
  locations: string[]; // Parsed locations
  selectedLocation?: string;
  status: AdjustmentStatus;
}

export interface QboSyncItem {
  id: string;
  date: string;
  type: DocType;
  docNumber: string;
  customer: string;
  sku: string;
  product: string;
  description: string;
  qty: number;
  shippingTo: string;
}