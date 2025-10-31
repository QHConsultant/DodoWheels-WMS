import React, { useState, useEffect } from 'react';
import { Dock } from './components/Dock';
import Dashboard from './pages/Dashboard';
import Inbound from './pages/Inbound';
import Outbound from './pages/Outbound';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Adjustment from './pages/Adjustment';
import QboSync from './pages/QboSync';
import Login from './pages/Login';
import DataReconciliation from './pages/DataReconciliation';
import { Language } from './translations';

export type View = 'dashboard' | 'inbound' | 'outbound' | 'inventory' | 'adjustment' | 'settings' | 'qbo-sync' | 'data-reconciliation';
export type Theme = 'light' | 'dark' | 'system';

export interface AppError {
  message: string;
  action: string;
}


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('system');
  const [language, setLanguage] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check session storage on initial load to maintain login state across refreshes
    return sessionStorage.getItem('wms-is-authenticated') === 'true';
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('wms-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    const savedLanguage = localStorage.getItem('wms-language') as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as View;
    
    if (view && ['dashboard', 'inbound', 'outbound', 'inventory', 'adjustment', 'settings', 'qbo-sync', 'data-reconciliation'].includes(view)) {
      setActiveView(view);
    }
    
    // Clean up the URL to remove the query parameter after setting the view
    // Important: Only remove params after we've read them
    if (window.location.search) {
        window.history.replaceState(null, '', window.location.pathname);
    }

  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    localStorage.setItem('wms-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wms-language', language);
  }, [language]);


  const handleLogin = (success: boolean) => {
    if (success) {
      // Persist authentication state in session storage
      sessionStorage.setItem('wms-is-authenticated', 'true');
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    // Clear authentication state from session storage
    sessionStorage.removeItem('wms-is-authenticated');
    setIsAuthenticated(false);
    setActiveView('dashboard'); // Reset to default view on logout
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard language={language} />;
      case 'inbound':
        return <Inbound />;
      case 'outbound':
        return <Outbound language={language} />;
      case 'inventory':
        return <Inventory />;
      case 'qbo-sync':
        return <QboSync language={language} />;
      case 'adjustment':
        return <Adjustment language={language} />;
       case 'data-reconciliation':
        return <DataReconciliation language={language} />;
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} onLogout={handleLogout} />;
      default:
        return <Dashboard language={language} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} language={language} setLanguage={setLanguage} />;
  }

  return (
    <div className="min-h-screen h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900">
      <main className="flex-grow overflow-y-auto">
        {renderView()}
      </main>
      <Dock activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
};

export default App;