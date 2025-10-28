import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { XIcon } from './icons/XIcon';

interface AdjustStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (sku: string, newTotalQuantity: number) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ item, onClose, onSave }) => {
  const [newQuantity, setNewQuantity] = useState(item.totalQuantity.toString());
  const [reason, setReason] = useState('Cycle Count');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const handleSave = () => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      onSave(item.sku, quantity);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Stock</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{item.productName} (<span className="font-mono">{item.sku}</span>)</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Quantity</label>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.totalQuantity}</p>
          </div>
           <div>
            <label htmlFor="newQuantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Quantity</label>
            <input
              id="newQuantity"
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              min="0"
              className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
             <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Adjustment</label>
             <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
             >
                <option>Cycle Count</option>
                <option>Damaged Goods</option>
                <option>Stock In</option>
                <option>Stock Out</option>
                <option>Other</option>
             </select>
          </div>
        </main>

        <footer className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};
