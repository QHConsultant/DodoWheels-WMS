

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Order, OrderStatus } from '../types';

interface SalesChartProps {
  orders: Order[];
  isLoading: boolean;
}

const processChartData = (orders: Order[]) => {
  const monthlySales: { [key: string]: number } = {};
  
  orders.forEach(order => {
    if (order.status !== OrderStatus.Cancelled) {
      const month = new Date(order.orderDate).toLocaleString('zh-CN', { month: 'short', year: '2-digit' });
      if (!monthlySales[month]) {
        monthlySales[month] = 0;
      }
      monthlySales[month] += order.totalAmount;
    }
  });

  const sortedMonths = Object.keys(monthlySales).sort((a, b) => {
    // FIX: A more robust date parsing for 'YY年M月' format from zh-CN locale
    const [yearA, monthA] = a.replace('年', ' ').replace('月', '').split(' ');
    const [yearB, monthB] = b.replace('年', ' ').replace('月', '').split(' ');
    // FIX: The new Date() constructor expects numbers for year and month when multiple arguments are provided.
    const dateA = new Date(parseInt(`20${yearA}`), parseInt(monthA) - 1);
    const dateB = new Date(parseInt(`20${yearB}`), parseInt(monthB) - 1);
    return dateA.getTime() - dateB.getTime();
  });

  return sortedMonths.map(month => ({
    name: month,
    "销售额": monthlySales[month],
  }));
};


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg">
        <p className="label font-semibold">{`${label}`}</p>
        <p className="intro text-indigo-500 dark:text-indigo-400">{`销售额: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

export const SalesChart: React.FC<SalesChartProps> = ({ orders, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 h-96 animate-pulse">
         <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
         <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-md mt-4"></div>
      </div>
    );
  }
  
  const chartData = processChartData(orders);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">月度销售额</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
            {/* FIX: Complete the BarChart component definition. The file was truncated. */}
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} 
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} 
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey="销售额" fill="rgb(99 102 241)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};