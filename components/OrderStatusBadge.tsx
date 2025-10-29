import React from 'react';
import { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusStyles: { [key in OrderStatus]: string } = {
  [OrderStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  [OrderStatus.Shipped]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  [OrderStatus.Picking]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  [OrderStatus.Packing]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};
