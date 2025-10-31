import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Order, OrderStatus } from '../types';
import { translations, Language } from '../translations';

interface OrderStatusPieChartProps {
  orders: Order[];
  isLoading: boolean;
  language: Language;
}

const COLORS: { [key in OrderStatus]: string } = {
  [OrderStatus.Completed]: '#22c55e', // green-500
  [OrderStatus.Shipped]: '#3b82f6',   // blue-500
  [OrderStatus.Pending]: '#f59e0b',   // amber-500
  [OrderStatus.Picking]: '#0ea5e9',   // sky-500
  [OrderStatus.Packing]: '#f97316',   // orange-500
  [OrderStatus.Cancelled]: '#ef4444', // red-500
};

const processPieData = (orders: Order[]) => {
  const statusCounts: { [key in OrderStatus]?: number } = {};
  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  }
  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg">
          <p className="label font-semibold">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

export const OrderStatusPieChart: React.FC<OrderStatusPieChartProps> = ({ orders, isLoading, language }) => {
  const t = translations[language].dashboard.pieChart;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 h-96 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="flex justify-center items-center h-full">
            <div className="w-48 h-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    );
  }

  const pieData = processPieData(orders);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 h-96">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.title}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as OrderStatus]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconSize={10}
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '20px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};