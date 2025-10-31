import React from 'react';
import { View } from '../App';
import { XIcon } from './icons/XIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';

interface Tool {
  id: View;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const tools: Tool[] = [
  {
    id: 'data-reconciliation',
    label: '数据整合',
    icon: ClipboardDocumentCheckIcon,
  },
  // Future tools can be added here
];

interface ToolboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (view: View) => void;
}

export const ToolboxModal: React.FC<ToolboxModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 flex justify-center items-center p-4 transition-opacity"
      aria-labelledby="toolbox-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[75vh] flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-slate-300/70 dark:border-slate-700/70">
          <h2 id="toolbox-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Toolbox
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700/50"
            aria-label="Close Toolbox"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="p-8 flex-grow overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-8">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="group flex flex-col items-center justify-center text-center space-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-200 dark:focus-visible:ring-offset-slate-800 rounded-lg p-2"
              >
                <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-all flex items-center justify-center">
                  <tool.icon className="h-10 w-10 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{tool.label}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};