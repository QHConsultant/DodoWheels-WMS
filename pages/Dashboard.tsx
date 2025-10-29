import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { fetchOrders, updateOrderStatus } from '../services/qboService';
import { OrderTable } from '../components/OrderTable';
import { SalesChart } from '../components/SalesChart';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { HomeIcon } from '../components/icons/HomeIcon';
import { translations, Language } from '../translations';


interface DashboardProps {
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ language }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const t = translations[language].dashboard;

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOrders = await fetchOrders();
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);


  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      setTimeout(handleCloseModal, 300); // Close modal after a short delay
    } catch (err) {
        console.error("Failed to update order status:", err);
        // Optionally show an error to the user
    }
  };
  
  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-500">{String(error)}</p>
        </div>
      );
    }

    const showSkeleton = isLoading && orders.length === 0;

    return (
      <div className="grid grid-cols-1 gap-8">
        <SalesChart orders={orders} isLoading={showSkeleton} language={language} />
        <OrderTable
          orders={orders}
          isLoading={showSkeleton}
          error={error}
          onRowClick={handleSelectOrder}
          language={language}
        />
      </div>
    );
  };


  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-3 sm:py-0 sm:h-16 gap-3">
            <div className="flex items-center space-x-3">
              <HomeIcon className="h-8 w-8 text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? t.refreshing : t.refreshButton}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={handleCloseModal} 
          onUpdateStatus={handleUpdateOrderStatus}
          language={language}
        />
      )}
    </>
  );
};

export default Dashboard;