import React from 'react';
import { View } from '../App';
import { HomeIcon } from './icons/HomeIcon';
import { InboxArrowDownIcon } from './icons/InboxArrowDownIcon';
import { ArrowUpOnSquareIcon } from './icons/ArrowUpOnSquareIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';

interface DockProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const dockItems = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'inbound', label: 'Inbound', icon: InboxArrowDownIcon },
  { id: 'outbound', label: 'Outbound', icon: ArrowUpOnSquareIcon },
  { id: 'inventory', label: 'Inventory', icon: ArchiveBoxIcon },
  { id: 'qbo-sync', label: 'QBO Data Sync', icon: DocumentPlusIcon },
  { id: 'adjustment', label: 'Adjustment', icon: SwitchHorizontalIcon },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
];

export const Dock: React.FC<DockProps> = ({ activeView, setActiveView }) => {
  return (
    <footer className="w-full flex justify-center p-2 z-50">
      <div className="flex items-end space-x-1 sm:space-x-2 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl shadow-lg p-1.5 sm:p-2">
        {dockItems.map(item => (
          <div key={item.id} className="relative group">
            <span className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded-md transition-opacity duration-200">
              {item.label}
            </span>
            <button
              onClick={() => setActiveView(item.id as View)}
              className={`flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transform hover:-translate-y-1 sm:hover:-translate-y-2 ${
                activeView === item.id 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'
              }`}
              aria-label={item.label}
              aria-current={activeView === item.id}
            >
              <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>
        ))}
      </div>
    </footer>
  );
};