import React from 'react';
import { Order } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  onRowClick: (order: Order) => void;
}

const TableSkeleton: React.FC = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden sm:table-cell">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto"></div>
        </td>
      </tr>
    ))}
  </>
);

export const OrderTable: React.FC<OrderTableProps> = ({ orders, isLoading, error, onRowClick }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">最近订单</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">订单号</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">客户</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">日期</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">状态</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">金额</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {isLoading && <TableSkeleton />}
            {!isLoading && error && (
              <tr>
                <td colSpan={5} className="text-center py-12 px-6">
                  <p className="text-red-500">{error}</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 px-6">
                  <p className="text-slate-500 dark:text-slate-400">未找到订单。</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && orders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => onRowClick(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{order.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{formatDate(order.orderDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><OrderStatusBadge status={order.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900 dark:text-slate-100 hidden sm:table-cell">{formatCurrency(order.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};