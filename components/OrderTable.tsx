import React from 'react';
import { Order } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { translations, Language } from '../translations';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  onRowClick: (order: Order) => void;
  language: Language;
}

const TableSkeleton: React.FC = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
        </td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden sm:table-cell">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto"></div>
        </td>
      </tr>
    ))}
  </>
);

const getLocaleConfig = (lang: Language) => {
    switch (lang) {
        case 'zh': return { locale: 'zh-CN', currency: 'CNY' };
        case 'fr': return { locale: 'fr-FR', currency: 'EUR' };
        default: return { locale: 'en-US', currency: 'USD' };
    }
};

export const OrderTable: React.FC<OrderTableProps> = ({ orders, isLoading, error, onRowClick, language }) => {
  const t = translations[language].orderTable;
  const { locale, currency } = getLocaleConfig(language);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.orderId}</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.customer}</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">{t.date}</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.status}</th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.amount}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {isLoading && <TableSkeleton />}
            {!isLoading && error && (
              <tr>
                <td colSpan={5} className="text-center py-12 px-3 sm:px-6">
                  <p className="text-red-500">{error}</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 px-3 sm:px-6">
                  <p className="text-slate-500 dark:text-slate-400">{t.noOrders}</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && orders.map((order) => (
              <tr 
                key={order.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => onRowClick(order)}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600 dark:text-sky-400">{order.id}</td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{order.customerName}</td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{formatDate(order.orderDate)}</td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm"><OrderStatusBadge status={order.status} /></td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900 dark:text-slate-100 hidden sm:table-cell">{formatCurrency(order.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};