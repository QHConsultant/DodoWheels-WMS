import React from 'react';

interface ConfigurationErrorProps {
  message: string;
  action: string;
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({ message, action }) => {
  return (
    <div className="w-full text-center py-12 px-4">
      <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-6 rounded-lg max-w-3xl mx-auto shadow-md">
        <h3 className="text-xl font-bold mb-2 text-left">Server Configuration Error</h3>
        <p className="text-md text-left mb-4">{message}</p>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-left mt-4">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Required Action:</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{action}</p>
            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">
                You can find these credentials in your app's dashboard on the Intuit Developer Portal.
            </p>
        </div>
      </div>
    </div>
  );
};