import React, { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus } from '../types';
import { XIcon } from './icons/XIcon';

interface ReceiveItemsModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onSave: (updatedPO: PurchaseOrder) => void;
}

export const ReceiveItemsModal: React.FC<ReceiveItemsModalProps> = ({ po, onClose, onSave }) => {
  const [receivedQuantities, setReceivedQuantities] = useState<{ [sku: string]: number }>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const handleQuantityChange = (sku: string, value: string) => {
    const numValue = parseInt(value, 10);
    const item = po.items.find(i => i.sku === sku);
    if (!item) return;

    const maxReceivable = item.quantityOrdered - item.quantityReceived;
    const newReceivedQty = isNaN(numValue) ? 0 : Math.max(0, Math.min(numValue, maxReceivable));
    
    setReceivedQuantities(prev => ({ ...prev, [sku]: newReceivedQty }));
  };

  const handleSave = () => {
    const updatedItems = po.items.map(item => ({
      ...item,
      quantityReceived: item.quantityReceived + (receivedQuantities[item.sku] || 0)
    }));
    
    const totalOrdered = updatedItems.reduce((sum, item) => sum + item.quantityOrdered, 0);
    const totalReceived = updatedItems.reduce((sum, item) => sum + item.quantityReceived, 0);
    
    let newStatus = PurchaseOrderStatus.Receiving;
    if (totalReceived >= totalOrdered) {
        newStatus = PurchaseOrderStatus.Received;
    }

    const updatedPO: PurchaseOrder = {
        ...po,
        status: newStatus,
        items: updatedItems
    };
    onSave(updatedPO);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Receive Items for PO</h2>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">{po.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-2 sm:p-3 text-left font-medium text-slate-600 dark:text-slate-300">Product</th>
                <th className="p-2 sm:p-3 text-center font-medium text-slate-600 dark:text-slate-300">Ordered</th>
                <th className="p-2 sm:p-3 text-center font-medium text-slate-600 dark:text-slate-300">Received</th>
                <th className="p-2 sm:p-3 text-center font-medium text-slate-600 dark:text-slate-300">Receiving Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {po.items.map(item => (
                <tr key={item.sku}>
                  <td className="p-2 sm:p-3 font-medium text-slate-800 dark:text-slate-200">{item.productName} <span className="text-slate-400 font-mono text-xs">{item.sku}</span></td>
                  <td className="p-2 sm:p-3 text-center text-slate-500 dark:text-slate-400">{item.quantityOrdered}</td>
                  <td className="p-2 sm:p-3 text-center text-slate-500 dark:text-slate-400">{item.quantityReceived}</td>
                  <td className="p-2 sm:p-3 text-center">
                    <input
                      type="number"
                      value={receivedQuantities[item.sku] || ''}
                      onChange={(e) => handleQuantityChange(item.sku, e.target.value)}
                      min="0"
                      max={item.quantityOrdered - item.quantityReceived}
                      className="w-20 p-1 text-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={(item.quantityOrdered - item.quantityReceived) <= 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        <footer className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Confirm Receipt
          </button>
        </footer>
      </div>
    </div>
  );
};