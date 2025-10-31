import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Order, OrderStatus } from '../types';
import { translations, Language } from '../translations';


interface SalesChartProps {
  orders: Order[];
  isLoading: boolean;
  language: Language;
}

const getLocaleConfig = (lang: Language) => {
    switch (lang) {
        case 'zh': return { locale: 'zh-CN', currency: 'CNY' };
        case 'fr': return { locale: 'fr-FR', currency: 'EUR' };
        default: return { locale: 'en-US', currency: 'USD' };
    }
};

const processChartData = (orders: Order[], language: Language) => {
  const monthlySales: { [key: string]: number } = {};
  const { locale } = getLocaleConfig(language);
  
  orders.forEach(order => {
    if (order.status !== OrderStatus.Cancelled) {
      const month = new Date(order.orderDate).toLocaleString(locale, { month: 'short', year: '2-digit' });
      if (!monthlySales[month]) {
        monthlySales[month] = 0;
      }
      monthlySales[month] += order.totalAmount;
    }
  });

  const frMonths: { [key: string]: number } = { 'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3, 'mai': 4, 'juin': 5, 'juil.': 6, 'août': 7, 'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11 };

  const sortedMonths = Object.keys(monthlySales).sort((a, b) => {
    const parseDate = (monthStr: string) => {
        if (language === 'zh') {
            const [year, month] = monthStr.replace('年', ' ').replace('月', '').split(' ');
            return new Date(parseInt(`20${year}`), parseInt(month) - 1);
        }
        if (language === 'fr') {
            const parts = monthStr.split(' ');
            const monthPart = parts[0];
            const yearPart = parts[1];
            const monthIndex = frMonths[monthPart];
            return new Date(parseInt(`20${yearPart}`), monthIndex);
        }
        // For 'en-US' like "Oct '23"
        const [month, year] = monthStr.split(" '");
        const monthIndex = new Date(Date.parse(month +" 1, 2012")).getMonth();
        return new Date(parseInt(`20${year}`), monthIndex);
    };
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    return dateA.getTime() - dateB.getTime();
  });

  return sortedMonths.map(month => ({
    name: month,
    [translations[language].salesChart.sales]: monthlySales[month],
  }));
};


const CustomTooltip = ({ active, payload, label, language }: any) => {
  const t = translations[language].salesChart;
  if (active && payload && payload.length) {
    const { locale, currency } = getLocaleConfig(language);
    return (
      <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg">
        <p className="label font-semibold">{`${label}`}</p>
        <p className="intro text-sky-500 dark:text-sky-400">{`${t.sales}: ${new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

export const SalesChart: React.FC<SalesChartProps> = ({ orders, isLoading, language }) => {
  const t = translations[language].salesChart;
  const { currency } = getLocaleConfig(language);
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 h-96 animate-pulse">
         <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
         <div className="h-full w-full bg-slate-200 dark:bg-slate-700 rounded-md mt-4"></div>
      </div>
    );
  }
  
  const chartData = processChartData(orders, language);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.title}</h2>
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
              tickFormatter={(value: number) => `${currency === 'EUR' ? '€' : '$'}${(value / 1000).toFixed(0)}k`} 
            />
            <Tooltip 
              content={<CustomTooltip language={language} />} 
              cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} 
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey={t.sales} fill="rgb(14 165 233)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};