import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { fetchOrders, updateOrderStatus } from '../services/qboService';
import { ArrowUpOnSquareIcon } from '../components/icons/ArrowUpOnSquareIcon';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { Language } from '../translations';

interface OutboundProps {
    language: Language;
}

const KanbanCard: React.FC<{ order: Order; onClick: () => void }> = ({ order, onClick }) => (
  <div
    draggable="true"
    onDragStart={(e) => {
      e.dataTransfer.setData('orderId', order.id);
      e.dataTransfer.effectAllowed = 'move';
    }}
    onClick={onClick}
    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all"
  >
    <div className="flex justify-between items-center mb-2">
      <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{order.id}</p>
      <OrderStatusBadge status={order.status} />
    </div>
    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{order.customerName}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.lineItems.length} line item(s)</p>
  </div>
);

const KanbanColumn: React.FC<{
  title: string;
  status: OrderStatus;
  orders: Order[];
  onCardClick: (order: Order) => void;
  onDrop: (status: OrderStatus, e: React.DragEvent) => void;
}> = ({ title, status, orders, onCardClick, onDrop }) => {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(status, e);
      }}
      className={`flex-1 min-w-[280px] w-1/4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3 transition-colors ${isOver ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
    >
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 px-2 pb-3">{title} ({orders.length})</h3>
      <div className="space-y-3 h-full overflow-y-auto">
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onClick={() => onCardClick(order)} />
        ))}
      </div>
    </div>
  );
};

const KanbanSkeleton: React.FC = () => (
  <>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex-1 min-w-[280px] w-1/4 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

const Outbound: React.FC<OutboundProps> = ({ language }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const fetchedOrders = await fetchOrders();
        setOrders(fetchedOrders);
    } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError(err.message || 'Failed to fetch orders');
    } finally {
        setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadOrders();
  }, [loadOrders]);


  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    const originalOrders = orders;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
        await updateOrderStatus(orderId, newStatus);
    } catch (err) {
        console.error("Failed to update order status:", err);
        // Revert UI on error
        setOrders(originalOrders);
        // Optionally show an error toast
    }
  };
  
  const handleDrop = (newStatus: OrderStatus, orderId: string) => {
    handleStatusUpdate(orderId, newStatus);
  };

  const columns: { title: string; status: OrderStatus }[] = [
    { title: 'Pending', status: OrderStatus.Pending },
    { title: 'Picking', status: OrderStatus.Picking },
    { title: 'Packing', status: OrderStatus.Packing },
    { title: 'Shipped', status: OrderStatus.Shipped },
  ];
  
  const renderContent = () => {
    if (error) {
        return (
            <div className="w-full text-center py-20">
                <h3 className="text-lg font-semibold text-red-500">An Error Occurred</h3>
                <p className="text-slate-500">{String(error)}</p>
            </div>
        )
    }
    if (isLoading && orders.length === 0) {
        return <KanbanSkeleton />;
    }

    return columns.map(col => (
        <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            orders={orders.filter(o => o.status === col.status)}
            onCardClick={setSelectedOrder}
            onDrop={(newStatus, e) => {
                const orderId = e.dataTransfer.getData('orderId');
                if (orderId) {
                   handleDrop(newStatus, orderId);
                }
            }}
        />
    ));
  }


  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <ArrowUpOnSquareIcon className="h-7 w-7 text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Outbound Workflow
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Orders'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex p-4 sm:p-6 lg:p-8 gap-6 overflow-x-auto">
        {renderContent()}
      </main>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={async (orderId, newStatus) => {
            await handleStatusUpdate(orderId, newStatus);
            setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null);
            setTimeout(() => setSelectedOrder(null), 300);
          }}
          language={language}
        />
      )}
    </>
  );
};

export default Outbound;
