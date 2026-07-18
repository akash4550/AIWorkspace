import { useUiStore } from '../../store/uiStore';
import { navigationConfig } from '../../config/navigation';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export const Sidebar = () => {
  const { isSidebarOpen } = useUiStore();
  const location = useLocation();

  // In a real app with Auth implemented (Phase 4), we'd get the user role here
  const currentUserRole = 'ADMIN'; 

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-sidebar-light dark:bg-sidebar-dark border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-500">AIWorkspace</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationConfig.map((item) => {
          // RBAC Check
          if (item.roles && !item.roles.includes(currentUserRole as any)) {
            return null; // Hide if user lacks role
          }

          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.disabled ? '#' : item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                item.disabled 
                  ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                  : isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {item.disabled && <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded">Soon</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 w-full transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
