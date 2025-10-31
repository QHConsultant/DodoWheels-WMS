import React, { useState, useEffect } from 'react';
import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { translations, Language } from '../translations';
import { SearchableSelect } from './SearchableSelect';

interface AdjustmentTableRowProps {
  item: AdjustmentLineItem;
  onUpdate: (item: AdjustmentLineItem) => Promise<void>;
  onCopy: (item: AdjustmentLineItem) => void;
  language: Language;
}

const StatusBadge: React.FC<{ status: AdjustmentStatus; t: typeof translations['en']['adjustment']['status'] }> = ({ status, t }) => {
  const styles = {
    [AdjustmentStatus.Confirmed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [AdjustmentStatus.Unconfirmed]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  };
  const statusText = status === AdjustmentStatus.Confirmed ? t.confirmed : t.unconfirmed;
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
      {statusText}
    </span>
  );
};

const YNBadge: React.FC<{ status: 'YES' | 'NO' | 'N/A' }> = ({ status }) => {
    if (status === 'N/A') {
        return <span className="text-xs text-slate-400">N/A</span>;
    }
    const styles = {
        'YES': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'NO': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
            {status}
        </span>
    );
};

export const AdjustmentTableRow: React.FC<AdjustmentTableRowProps> = ({ item, onUpdate, onCopy, language }) => {
  const t = translations[language].adjustment;
  const [isEditing, setIsEditing] = useState(false);
  const [editableItem, setEditableItem] = useState(item);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableItem(item);
  }, [item]);
  
  useEffect(() => {
    if (item.isNew) {
      setIsEditing(true);
    }
  }, [item.isNew]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const locale = language === 'zh' ? 'zh-CN' : language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
  };

  const handleCopy = () => {
    onCopy(item);
  };

  const handleSave = async () => {
    // For copied items, a location must be selected.
    if (item.isNew && !editableItem.selectedLocation) {
      alert('Please select a location before saving.');
      return;
    }
    setIsSaving(true);
    await onUpdate(editableItem);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableItem(item);
    setIsEditing(false);
  };

  const isNegativeFlow = item.docType === 'Invoice' || item.docType === 'Sale Receipts';

  if (isEditing) {
    return (
      <tr className="bg-slate-50 dark:bg-slate-700/50">
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{formatDate(item.date)}</td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{item.customer}</td>
        <td className="px-3 sm:px-6 py-4"><input type="text" value={editableItem.sku} onChange={e => setEditableItem({...editableItem, sku: e.target.value})} className="w-24 p-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/></td>
        <td className="px-3 sm:px-6 py-4 max-w-xs hidden md:table-cell">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.productName}</p>
            <input type="text" value={editableItem.description} onChange={e => setEditableItem({...editableItem, description: e.target.value})} className="w-full p-1 mt-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/>
        </td>
        <td className="px-3 sm:px-6 py-4"><input type="number" value={editableItem.qty} onChange={e => setEditableItem({...editableItem, qty: parseInt(e.target.value) || 0})} className="w-16 p-1 text-sm text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/></td>
        <td className="px-3 sm:px-6 py-4">
            <SearchableSelect
                options={item.locations}
                value={editableItem.selectedLocation}
                onChange={(newValue) => setEditableItem({ ...editableItem, selectedLocation: newValue })}
                placeholder={t.selectLocation}
            />
        </td>
        <td className="px-3 sm:px-6 py-4 text-center"><StatusBadge status={item.status} t={t.status} /></td>
        <td className="px-3 sm:px-6 py-4 text-center"><YNBadge status={item.yn || 'N/A'} /></td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
            <button onClick={handleSave} disabled={isSaving} className="text-green-600 hover:text-green-800 disabled:opacity-50">{isSaving ? '...' : t.actions.save}</button>
            <button onClick={handleCancel} disabled={isSaving} className="text-slate-500 hover:text-slate-700 disabled:opacity-50">{t.actions.cancel}</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">{formatDate(item.date)}</td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600 dark:text-sky-400">{item.docNumber}</td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{item.customer}</td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
      <td className="px-3 sm:px-6 py-4 text-sm max-w-xs hidden md:table-cell">
        <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={item.productName}>{item.productName}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate" title={item.description}>{item.description}</div>
      </td>
      <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${isNegativeFlow ? 'text-red-500' : 'text-green-500'}`}>
        {isNegativeFlow ? '-' : '+'} {item.qty}
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono">{item.selectedLocation || 'N/A'}</td>
      <td className="px-3 sm:px-6 py-4 text-center"><StatusBadge status={item.status} t={t.status} /></td>
      <td className="px-3 sm:px-6 py-4 text-center"><YNBadge status={item.yn || 'N/A'} /></td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
        {item.status === AdjustmentStatus.Unconfirmed ? (
            <>
                <button onClick={handleCopy} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Copy
                </button>
                <button onClick={() => setIsEditing(true)} className="text-sky-600 hover:text-sky-800">{t.actions.edit}</button>
            </>
        ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Confirmed</span>
        )}
      </td>
    </tr>
  );
};