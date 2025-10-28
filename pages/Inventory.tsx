import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchInventory } from '../services/inventoryService';
import { InventoryItem } from '../types';
import { ArchiveBoxIcon } from '../components/icons/ArchiveBoxIcon';
import { AdjustStockModal } from '../components/AdjustStockModal';
import { RefreshIcon } from '../components/icons/RefreshIcon';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInventory();
      setInventory(data);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err.message || 'Failed to fetch inventory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);


  const filteredInventory = useMemo(() =>
    inventory.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [inventory, searchTerm]);
  
  const handleStockUpdate = (sku: string, newTotalQuantity: number) => {
    // This is a local update to simulate adjusting stock.
    setInventory(prev => prev.map(item => 
      item.sku === sku ? { ...item, totalQuantity: newTotalQuantity } : item
    ));
    setItemToAdjust(null);
  };
  
  const renderContent = () => {
    if (error) {
      return <div className="text-center py-20"><p className="text-red-500">{String(error)}</p></div>;
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Product Name</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Locations</th>
                   <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mx-auto"></div></td>
                      <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                       <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto"></div></td>
                    </tr>
                  ))
                ) : filteredInventory.map((item) => (
                  <tr key={item.sku}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-slate-800 dark:text-slate-200">{item.totalQuantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {item.locations.map(l => `${l.locationId} (${l.quantity})`).join(', ')}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button 
                        onClick={() => setItemToAdjust(item)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    );
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <ArchiveBoxIcon className="h-7 w-7 text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Inventory Control
              </h1>
            </div>
             <div className="flex items-center gap-4">
                <div className="w-full max-w-xs">
                   <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={loadInventory}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>

      {itemToAdjust && (
        <AdjustStockModal 
          item={itemToAdjust} 
          onClose={() => setItemToAdjust(null)} 
          onSave={handleStockUpdate} 
        />
      )}
    </>
  );
};

export default Inventory;