import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { ArrowUpOnSquareIcon } from '../components/icons/ArrowUpOnSquareIcon';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { ConfigurationError } from '../components/ConfigurationError';
import { QBOIcon } from '../components/icons/QBOIcon';

type QBOStatus = 'loading' | 'connected' | 'disconnected' | 'error';
interface ConfigError { message: string; action: string; }

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

const Outbound: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [qboStatus, setQboStatus] = useState<QBOStatus>('loading');
  const [configError, setConfigError] = useState<ConfigError | null>(null);
  
  const loadOrders = useCallback(async () => {
    if (qboStatus !== 'connected') return;
    
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
            if (response.status === 401) {
                setQboStatus('disconnected');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch orders from QBO.');
        }
        const fetchedOrders: Order[] = await response.json();
        setOrders(fetchedOrders);
    } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError(err.message || 'Failed to fetch orders');
    } finally {
        setIsLoading(false);
    }
  }, [qboStatus]);

  useEffect(() => {
    // Check for config errors from backend redirect
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    const errorAction = params.get('action');
    if (errorMsg && errorAction) {
        setConfigError({ message: errorMsg, action: errorAction });
        setQboStatus('error'); // Set status to error to prevent other UI from showing
        return;
    }

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/status');
            if (!response.ok) throw new Error('Could not check QBO status.');
            const data = await response.json();
            setQboStatus(data.isConnected ? 'connected' : 'disconnected');
        } catch (err) {
            console.error(err);
            setQboStatus('error');
        }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (qboStatus === 'connected') {
        loadOrders();
    }
  }, [qboStatus, loadOrders]);


  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
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
    if (configError) {
        return <ConfigurationError message={configError.message} action={configError.action} />;
    }
    if (qboStatus === 'loading') {
        return (
            <div className="w-full flex justify-center items-center py-20">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    if (qboStatus === 'disconnected') {
        return (
            <div className="w-full text-center py-20 flex justify-center items-center">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 max-w-lg">
                <QBOIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Connect to QuickBooks Online</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">To manage outbound orders, you need to connect your QuickBooks Online account. This will sync your sales receipts and allow for real-time order processing.</p>
                <button 
                  onClick={() => window.location.href = '/auth'}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
                >
                  Connect to QuickBooks
                </button>
              </div>
            </div>
        );
    }
    if (qboStatus === 'error') {
       return (
            <div className="w-full text-center py-20">
               <h3 className="text-lg font-semibold text-red-500">Connection Error</h3>
               <p className="text-slate-500">Could not connect to the backend service. Please check your network or try again later.</p>
           </div>
       );
   }

    if (error) {
        return (
            <div className="w-full text-center py-20">
                <h3 className="text-lg font-semibold text-red-500">An Error Occurred</h3>
                <p className="text-slate-500">{String(error)}</p>
            </div>
        )
    }
    if (isLoading) {
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
                disabled={isLoading || qboStatus !== 'connected'}
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
          onUpdateStatus={(orderId, newStatus) => {
            handleStatusUpdate(orderId, newStatus);
            setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null);
            setTimeout(() => setSelectedOrder(null), 500);
          }}
        />
      )}
    </>
  );
};

export default Outbound;
