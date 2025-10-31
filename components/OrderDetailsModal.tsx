import React, { useEffect } from 'react';
import { Order, OrderStatus, InventoryStatus } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { XIcon } from './icons/XIcon';
import { Language } from '../translations';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  language: Language;
}

const getLocaleConfig = (lang: Language) => {
    switch (lang) {
        case 'zh': return { locale: 'zh-CN', currency: 'CNY' };
        case 'fr': return { locale: 'fr-FR', currency: 'EUR' };
        default: return { locale: 'en-US', currency: 'USD' };
    }
};

const StockStatusIndicator: React.FC<{ status: InventoryStatus }> = ({ status }) => (
  <div className="flex items-center">
    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${status === InventoryStatus.InStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
    <span>{status}</span>
  </div>
);

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, onUpdateStatus, language }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  const { locale, currency } = getLocaleConfig(language);

  const canStartPicking = order.status === OrderStatus.Pending;
  const canFulfill = order.status === OrderStatus.Picking;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h2>
            <p className="text-sm text-sky-600 dark:text-sky-400 font-mono">{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Customer</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Order Date</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(order.orderDate).toLocaleDateString(locale)}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Total Amount</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-3">Order Items</h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-300">Product</th>
                  <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">SKU</th>
                  <th className="p-3 text-center font-medium text-slate-600 dark:text-slate-300">Qty</th>
                  <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-300">Location</th>
                  <th className="p-3 text-left font-medium text-slate-600 dark:text-slate-300">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {order.lineItems.map((item) => (
                  <tr key={item.sku}>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell font-mono">{item.sku}</td>
                    <td className="p-3 text-center text-slate-500 dark:text-slate-400">{item.quantity}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{item.location}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400"><StockStatusIndicator status={item.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        <footer className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex flex-col sm:flex-row sm:justify-end items-center gap-3">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Close
          </button>
          {canStartPicking && (
            <button
              onClick={() => onUpdateStatus(order.id, OrderStatus.Picking)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              Start Picking
            </button>
          )}
           {canFulfill && (
            <button
              onClick={() => onUpdateStatus(order.id, OrderStatus.Shipped)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Mark as Shipped
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};