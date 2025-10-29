import React, { useState, useEffect } from 'react';
import { AdjustmentLineItem, AdjustmentStatus } from '../types';
import { translations, Language } from '../translations';

interface AdjustmentTableRowProps {
  item: AdjustmentLineItem;
  onUpdate: (item: AdjustmentLineItem) => Promise<void>;
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

export const AdjustmentTableRow: React.FC<AdjustmentTableRowProps> = ({ item, onUpdate, language }) => {
  const t = translations[language].adjustment;
  const [isEditing, setIsEditing] = useState(false);
  const [editableItem, setEditableItem] = useState(item);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableItem(item); // Sync with parent prop changes
  }, [item]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(editableItem);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableItem(item);
    setIsEditing(false);
  };

  const handleLock = async () => {
      if (!editableItem.selectedLocation) {
          alert('Please select a location before locking.');
          return;
      }
      setIsSaving(true);
      await onUpdate({ ...editableItem, status: AdjustmentStatus.Confirmed });
      setIsSaving(false);
  };

  const handleUnlock = async () => {
    const password = prompt(t.unlockPrompt);
    if (password === 'password') { // Hardcoded password, same as backend
        setIsSaving(true);
        await onUpdate({ ...editableItem, status: AdjustmentStatus.Unconfirmed });
        setIsSaving(false);
    } else if (password !== null) {
        alert('Invalid password.');
    }
  };

  const isLocked = item.status === AdjustmentStatus.Confirmed;
  const isNegativeFlow = item.docType === 'Invoice' || item.docType === 'Sale Receipts';

  if (isEditing) {
    return (
      <tr className="bg-slate-50 dark:bg-slate-700/50">
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell"><input type="text" value={editableItem.sku} onChange={e => setEditableItem({...editableItem, sku: e.target.value})} className="w-24 p-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/></td>
        <td className="px-3 sm:px-6 py-4 hidden md:table-cell"><input type="text" value={editableItem.description} onChange={e => setEditableItem({...editableItem, description: e.target.value})} className="w-48 p-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/></td>
        <td className="px-3 sm:px-6 py-4"><input type="number" value={editableItem.qty} onChange={e => setEditableItem({...editableItem, qty: parseInt(e.target.value) || 0})} className="w-16 p-1 text-sm text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"/></td>
        <td className="px-3 sm:px-6 py-4">
            <select
                value={editableItem.selectedLocation || ''}
                onChange={(e) => setEditableItem({...editableItem, selectedLocation: e.target.value})}
                className="w-32 p-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"
            >
                <option value="" disabled>{t.selectLocation}</option>
                {item.locations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
          </select>
        </td>
        <td className="px-3 sm:px-6 py-4"><StatusBadge status={item.status} t={t.status} /></td>
        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
            <button onClick={handleSave} disabled={isSaving} className="text-green-600 hover:text-green-800 disabled:opacity-50">{isSaving ? '...' : t.actions.save}</button>
            <button onClick={handleCancel} disabled={isSaving} className="text-slate-500 hover:text-slate-700 disabled:opacity-50">{t.actions.cancel}</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{item.docNumber}</td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">{item.sku}</td>
      <td className="px-3 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate hidden md:table-cell">{item.description}</td>
      <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${isNegativeFlow ? 'text-red-500' : 'text-green-500'}`}>
        {item.qty}
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-mono">{item.selectedLocation || 'N/A'}</td>
      <td className="px-3 sm:px-6 py-4 text-center"><StatusBadge status={item.status} t={t.status} /></td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
        {!isLocked && <button onClick={() => setIsEditing(true)} disabled={isSaving} className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50">{t.actions.edit}</button>}
        {isLocked ? (
             <button onClick={handleUnlock} disabled={isSaving} className="text-yellow-600 hover:text-yellow-800 disabled:opacity-50">{isSaving ? '...' : t.actions.unlock}</button>
        ) : (
             <button onClick={handleLock} disabled={isSaving || !item.selectedLocation} className="text-blue-600 hover:text-blue-800 disabled:opacity-50">{isSaving ? '...' : t.actions.lock}</button>
        )}
      </td>
    </tr>
  );
};