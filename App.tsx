import React, { useState, useEffect } from 'react';
import { Dock } from './components/Dock';
import Dashboard from './pages/Dashboard';
import Inbound from './pages/Inbound';
import Outbound from './pages/Outbound';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Adjustment from './pages/Adjustment';
import Login from './pages/Login';

export type View = 'dashboard' | 'inbound' | 'outbound' | 'inventory' | 'adjustment' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

export interface AppError {
  message: string;
  action: string;
}


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('system');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('wms-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as View;
    
    if (view && ['dashboard', 'inbound', 'outbound', 'inventory', 'adjustment', 'settings'].includes(view)) {
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

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveView('dashboard'); // Reset to default view on logout
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inbound':
        return <Inbound />;
      case 'outbound':
        return <Outbound />;
      case 'inventory':
        return <Inventory />;
      case 'adjustment':
        return <Adjustment />;
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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