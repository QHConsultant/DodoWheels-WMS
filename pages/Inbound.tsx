import React, { useState, useEffect, useCallback } from 'react';
import { fetchPurchaseOrders, updatePurchaseOrder } from '../services/inboundService';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import { InboxArrowDownIcon } from '../components/icons/InboxArrowDownIcon';
import { ReceiveItemsModal } from '../components/ReceiveItemsModal';
import { RefreshIcon } from '../components/icons/RefreshIcon';

const POStatusBadge: React.FC<{ status: PurchaseOrderStatus }> = ({ status }) => {
  const statusStyles: { [key in PurchaseOrderStatus]: string } = {
    [PurchaseOrderStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [PurchaseOrderStatus.Receiving]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [PurchaseOrderStatus.Received]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};


const Inbound: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPOs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pos = await fetchPurchaseOrders();
      setPurchaseOrders(pos);
    } catch (err: any) {
      console.error('Failed to fetch purchase orders:', err);
      setError(err.message || 'Failed to fetch purchase orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPOs();
  }, [loadPOs]);
  
  const handleUpdatePO = async (updatedPO: PurchaseOrder) => {
    try {
        await updatePurchaseOrder(updatedPO);
        setPurchaseOrders(prevPOs => prevPOs.map(po => po.id === updatedPO.id ? updatedPO : po));
        setSelectedPO(null);
    } catch (err) {
        console.error("Failed to update PO:", err);
        // Optionally show error to user
    }
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
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">PO Number</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Supplier</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Expected</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                      <td className="px-3 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                      <td className="px-3 sm:px-6 py-4 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                      <td className="px-3 sm:px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
                      <td className="px-3 sm:px-6 py-4 text-center"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto"></div></td>
                    </tr>
                  ))
                ) : purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600 dark:text-sky-400">{po.id}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{po.supplier}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{new Date(po.expectedDelivery).toLocaleDateString()}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm"><POStatusBadge status={po.status} /></td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button 
                        onClick={() => setSelectedPO(po)}
                        disabled={po.status === PurchaseOrderStatus.Received}
                        className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-sky-600"
                      >
                        Receive Items
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
          <div className="flex flex-wrap items-center justify-between py-3 sm:py-0 sm:h-16 gap-3">
            <div className="flex items-center space-x-3">
              <InboxArrowDownIcon className="h-7 w-7 text-sky-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Inbound Operations
              </h1>
            </div>
             <div className="flex items-center space-x-4">
               <button
                  onClick={loadPOs}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Refreshing...' : 'Refresh POs'}
                </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>

      {selectedPO && <ReceiveItemsModal po={selectedPO} onClose={() => setSelectedPO(null)} onSave={handleUpdatePO} />}
    </>
  );
};

export default Inbound;