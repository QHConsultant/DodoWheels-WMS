import React from 'react';
import { translations, Language } from '../translations';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { HashtagIcon } from './icons/HashtagIcon';

interface KeyMetricsProps {
  metrics: {
    revenue: number;
    pending: number;
    completed: number;
    avgValue: number;
  };
  isLoading: boolean;
  language: Language;
}

interface MetricCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    isLoading: boolean;
}

const getLocaleConfig = (lang: Language) => {
    switch (lang) {
        case 'zh': return { locale: 'zh-CN', currency: 'CNY' };
        case 'fr': return { locale: 'fr-FR', currency: 'EUR' };
        default: return { locale: 'en-US', currency: 'USD' };
    }
};

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, value, isLoading }) => {
    if(isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center space-x-4 animate-pulse">
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
            </div>
        )
    }
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center space-x-4">
            <div className="p-3 bg-sky-100 dark:bg-sky-500/20 rounded-full">
                <Icon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    )
}

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ metrics, isLoading, language }) => {
  const t = translations[language].dashboard.kpis;
  const { locale, currency } = getLocaleConfig(language);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

  const kpiData = [
    { icon: CurrencyDollarIcon, title: t.totalRevenue, value: formatCurrency(metrics.revenue) },
    { icon: ClockIcon, title: t.pendingOrders, value: metrics.pending.toString() },
    { icon: CheckCircleIcon, title: t.completedOrders, value: metrics.completed.toString() },
    { icon: HashtagIcon, title: t.avgOrderValue, value: formatCurrency(metrics.avgValue) },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map(kpi => (
            <MetricCard 
                key={kpi.title}
                icon={kpi.icon}
                title={kpi.title}
                value={kpi.value}
                isLoading={isLoading}
            />
        ))}
    </div>
  );
};