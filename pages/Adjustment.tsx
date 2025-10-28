import React, { useState, useEffect, useCallback } from 'react';
import { DocType, AdjustmentLineItem, AdjustmentStatus } from '../types';
import { fetchAdjustmentData } from '../services/adjustmentService';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';

const AdjustmentStatusBadge: React.FC<{ status: AdjustmentStatus }> = ({ status }) => {
  const statusStyles: { [key in AdjustmentStatus]: string } = {
    [AdjustmentStatus.Confirmed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [AdjustmentStatus.Unconfirmed]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const AdjustmentTableRow: React.FC<{
  item: AdjustmentLineItem;
  onConfirm: (id: string) => void;
  onSave: (item: AdjustmentLineItem) => Promise<void>;
  isSaving: boolean;
}> = ({ item, onConfirm, onSave, isSaving }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(item);

    const handleSave = async () => {
        await onSave(editData);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditData(item);
        setIsEditing(false);
    }
    
    if (isEditing) {
        return (
            <tr className="bg-slate-50 dark:bg-slate-900/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
                <td className="px-6 py-4"><input type="text" value={editData.sku} onChange={e => setEditData({...editData, sku: e.target.value})} className="w-full p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm"/></td>
                <td className="px-6 py-4"><input type="text" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm" /></td>
                <td className="px-6 py-4"><input type="number" value={editData.qty} onChange={e => setEditData({...editData, qty: parseInt(e.target.value, 10) || 0})} className="w-20 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm" /></td>
                <td className="px-6 py-4">
                    <select value={editData.selectedLocation} onChange={e => setEditData({...editData, selectedLocation: e.target.value})} className="w-full p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm" disabled={item.locations.length === 0}>
                        {item.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                         {item.locations.length === 0 && <option>N/A</option>}
                    </select>
                </td>
                <td className="px-6 py-4 text-sm"><AdjustmentStatusBadge status={item.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                    {isSaving ? (
                        <div className="flex justify-end items-center">
                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <>
                            <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Save</button>
                            <button onClick={handleCancel} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">Cancel</button>
                        </>
                    )}
                </td>
            </tr>
        )
    }

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{item.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-800 dark:text-slate-200">{item.qty}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.selectedLocation || 'N/A'}</td>
            <td className="px-6 py-4 text-sm"><AdjustmentStatusBadge status={item.status} /></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                {item.status === AdjustmentStatus.Unconfirmed && <button onClick={() => onConfirm(item.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Confirm</button>}
                <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
            </td>
        </tr>
    );
};


const Adjustment: React.FC = () => {
    const TABS: DocType[] = ['Invoice', 'Sale Receipts', 'Credit Memo', 'Estimate'];
    const [activeTab, setActiveTab] = useState<DocType>('Invoice');
    const [items, setItems] = useState<AdjustmentLineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingItemId, setSavingItemId] = useState<string | null>(null);

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAdjustmentData(activeTab);
            setItems(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load adjustment data.");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);


    useEffect(() => {
        loadItems();
    }, [activeTab, loadItems]);


    const handleConfirm = (id: string) => {
        setItems(prev => prev.map(item => item.id === id ? {...item, status: AdjustmentStatus.Confirmed } : item));
    };

    const handleSave = async (updatedItem: AdjustmentLineItem) => {
        setSavingItemId(updatedItem.id);
        // Simulate saving delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Update local state for all tabs
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setSavingItemId(null);
    }

    const renderContent = () => {
        if (error) {
            const isAuthError = error.includes('QuickBooks Online connection required');
            return (
                <div className="w-full text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-red-500">An Error Occurred</h3>
                    <p className="text-slate-500 mb-4">{String(error)}</p>
                    {isAuthError && (
                        <button 
                            onClick={() => window.location.href = '?view=outbound'}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Go to Outbound Page to Connect
                        </button>
                    )}
                </div>
            );
        }
    
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">单据号码</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">SKU</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Qty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">状态</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                          <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mx-auto"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
                          <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : items.length > 0 ? (
                        items.map((item) => <AdjustmentTableRow 
                            key={item.id} 
                            item={item} 
                            onConfirm={handleConfirm} 
                            onSave={handleSave} 
                            isSaving={savingItemId === item.id}
                        />)
                    ) : !isLoading && (
                        <tr>
                           <td colSpan={7} className="text-center py-12 px-6">
                             <p className="text-slate-500 dark:text-slate-400">No items found for {activeTab}.</p>
                           </td>
                         </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        );
    }

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SwitchHorizontalIcon className="h-7 w-7 text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                库存调整 (Inventory Adjustment)
              </h1>
            </div>
             <button
                onClick={() => loadItems()}
                disabled={isLoading}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
             >
              <RefreshIcon className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${
                            activeTab === tab 
                            ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
        {renderContent()}
      </main>
    </>
  );
};

export default Adjustment;