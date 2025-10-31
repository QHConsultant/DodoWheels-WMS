import React, { useState, FormEvent } from 'react';
import { translations, Language } from '../translations';

interface LoginProps {
  onLogin: (success: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, language, setLanguage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language].login;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network request
    setTimeout(() => {
      if (username === 'admin' && password === 'password') {
        onLogin(true);
      } else {
        setError(t.errorMessage);
        onLogin(false);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen h-screen flex flex-col justify-center items-center font-sans bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white">DodoWheel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t.subtitle}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="admin"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="password"
              />
            </div>

            <div className="flex justify-center">
                <div className="flex items-center space-x-1 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                    <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                            language === 'en'
                            ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-900'
                            : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                        }`}
                        >
                        English
                    </button>
                    <button
                        type="button"
                        onClick={() => setLanguage('zh')}
                        className={`flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                            language === 'zh'
                            ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-900'
                            : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                        }`}
                        >
                        中文
                    </button>
                     <button
                        type="button"
                        onClick={() => setLanguage('fr')}
                        className={`flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                            language === 'fr'
                            ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-900'
                            : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-900/60'
                        }`}
                        >
                        Français
                    </button>
                </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
                           disabled:bg-sky-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  t.signInButton
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;