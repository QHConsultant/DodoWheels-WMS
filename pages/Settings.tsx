import React from 'react';
import { Cog6ToothIcon } from '../components/icons/Cog6ToothIcon';
import { Theme } from '../App';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { ComputerDesktopIcon } from '../components/icons/ComputerDesktopIcon';
import { ArrowLeftOnRectangleIcon } from '../components/icons/ArrowLeftOnRectangleIcon';


interface SettingsProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, onLogout }) => {
  const themeOptions = [
    { name: 'Light', value: 'light', icon: SunIcon },
    { name: 'Dark', value: 'dark', icon: MoonIcon },
    { name: 'System', value: 'system', icon: ComputerDesktopIcon },
  ];

  const placeholderSettings = [
    { title: 'Manage Users', description: 'Add, remove, or edit user roles and permissions.' },
    { title: 'Warehouse Locations', description: 'Define and manage aisles, racks, and bins.' },
    { title: 'Integrations', description: 'Connect with shipping carriers and other platforms.' },
    { title: 'Automation Rules', description: 'Set up rules to automate repetitive tasks.' },
  ];

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-7 w-7 text-sky-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                System Settings
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Theme Settings Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Appearance</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose how WMS Pro looks. Select a theme or sync with your system.</p>
            <div className="flex items-center space-x-2 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
              {themeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as Theme)}
                  className={`flex-1 flex items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    theme === option.value
                      ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-900'
                      : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <option.icon className="w-5 h-5" />
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Settings Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Manage your session and account details.</p>
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800"
            >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                Sign Out
            </button>
          </div>

          {/* Placeholder Cards */}
          {placeholderSettings.map(setting => (
            <div key={setting.title} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 opacity-60">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{setting.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{setting.description}</p>
              <button disabled className="px-4 py-2 text-sm font-medium text-white bg-slate-400 dark:bg-slate-600 rounded-md cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Settings;