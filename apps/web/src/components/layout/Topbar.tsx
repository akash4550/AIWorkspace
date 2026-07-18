import { useEffect, useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { Menu, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from '../ui/NotificationBell';
import { useLocation } from 'react-router-dom';
import { GlobalSearchOverlay } from '../../features/search/GlobalSearchOverlay';

export const Topbar = () => {
  const { toggleSidebar } = useUiStore();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple breadcrumb generator
  const pathnames = location.pathname.split('/').filter(x => x);
  const breadcrumb = pathnames.length > 0 ? pathnames[pathnames.length - 1] : 'Dashboard';

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden sm:flex items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Organization</span>
          <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>
          <span className="text-gray-900 dark:text-white font-medium capitalize">{breadcrumb}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Global Search Trigger */}
        <div className="hidden md:flex relative cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <div className="w-64 pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-400 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <span>Search...</span>
            <kbd className="hidden sm:inline-block border border-gray-300 dark:border-gray-600 rounded px-1.5 text-[10px] font-semibold text-gray-500">Cmd K</kbd>
          </div>
        </div>

        <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        <NotificationBell />

        <ThemeToggle />

        {/* Profile Menu Placeholder */}
        <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 dark:bg-primary-900/50 dark:border-primary-800 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-400 cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
};
