import React, { useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { Moon, Sun, Monitor } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useUiStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-md">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded text-sm ${theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded text-sm ${theme === 'dark' ? 'bg-slate-800 shadow text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded text-sm ${theme === 'system' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};
