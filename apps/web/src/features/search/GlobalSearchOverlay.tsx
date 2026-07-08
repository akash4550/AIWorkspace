import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, FolderKanban, CheckSquare, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from './hooks/useSearch';
import { useDebounce } from 'use-debounce';

export const GlobalSearchOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm] = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = useGlobalSearch(debouncedTerm);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const renderIcon = (module: string) => {
    switch (module) {
      case 'projects': return <FolderKanban size={16} className="text-blue-500" />;
      case 'tasks': return <CheckSquare size={16} className="text-emerald-500" />;
      case 'crm': return <UsersRound size={16} className="text-amber-500" />;
      default: return <Search size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 mx-4"
        onClick={e => e.stopPropagation()}
      >
        
        <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <Search size={20} className="text-gray-400 mr-3" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search projects, tasks, clients..." 
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-lg placeholder-gray-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {isLoading && <Loader2 size={20} className="text-gray-400 animate-spin mr-2" />}
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        {searchTerm.trim().length > 1 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {results?.items.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-gray-500">
                No results found for "{searchTerm}"
              </div>
            ) : (
              <ul className="py-2">
                {results?.items.map(item => (
                  <li key={`${item.module}-${item.id}`}>
                    <button
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleSelect(item.url)}
                    >
                      <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                        {renderIcon(item.module)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {item.module}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            {results && results.total > 20 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
                <button 
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                    onClose();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {results.total} results
                </button>
              </div>
            )}
          </div>
        )}
        
        {searchTerm.trim().length <= 1 && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">
              Type at least 2 characters to search across your workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
