import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Title, Card, Text, Badge, TextInput, Select, SelectItem } from '@tremor/react';
import { Search, FolderKanban, CheckSquare, UsersRound } from 'lucide-react';
import { useGlobalSearch } from './hooks/useSearch';
import { useDebounce } from 'use-debounce';

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedTerm] = useDebounce(searchTerm, 500);
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  
  const navigate = useNavigate();

  const activeModules = moduleFilter === 'all' ? undefined : [moduleFilter];
  const { data: results, isLoading } = useGlobalSearch(debouncedTerm, activeModules, 50);

  // Update URL on debounce
  useEffect(() => {
    if (debouncedTerm) {
      setSearchParams({ q: debouncedTerm });
    }
  }, [debouncedTerm, setSearchParams]);

  const renderIcon = (module: string) => {
    switch (module) {
      case 'projects': return <FolderKanban size={20} className="text-blue-500" />;
      case 'tasks': return <CheckSquare size={20} className="text-emerald-500" />;
      case 'crm': return <UsersRound size={20} className="text-amber-500" />;
      default: return <Search size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Search Results</h1>
        <p className="text-gray-500 text-sm">Find anything across your workspace</p>
      </div>

      <div className="flex gap-4 mb-6">
        <TextInput
          icon={Search}
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={moduleFilter} onValueChange={setModuleFilter} className="max-w-[200px]">
          <SelectItem value="all">All Modules</SelectItem>
          <SelectItem value="projects">Projects</SelectItem>
          <SelectItem value="tasks">Tasks</SelectItem>
          <SelectItem value="crm">CRM</SelectItem>
        </Select>
      </div>

      <div className="flex-1 overflow-auto pb-8">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Text>Searching...</Text>
          </div>
        ) : !results || results.items.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <Title>No results found</Title>
            <Text>Try adjusting your search term or filters.</Text>
          </div>
        ) : (
          <div className="space-y-4">
            <Text className="mb-4">Found {results.total} results</Text>
            {results.items.map((item) => (
              <Card 
                key={`${item.module}-${item.id}`} 
                className="hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                onClick={() => navigate(item.url)}
              >
                <div className="pt-1">
                  {renderIcon(item.module)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <Title className="text-blue-600 hover:underline">{item.title}</Title>
                    <Badge size="xs" color="gray">{item.module}</Badge>
                  </div>
                  <Text className="mt-1 text-sm">{item.description}</Text>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
