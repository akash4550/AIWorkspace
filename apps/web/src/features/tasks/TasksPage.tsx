import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { KanbanBoard } from './components/KanbanBoard';
import { Search, Plus, List, Trello } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const TasksPage = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  
  // For demo, we are hardcoding a specific project ID or just fetching all tasks
  // In a real app, this page would likely be nested under /projects/:id/tasks
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search],
    queryFn: async () => {
      const res = await api.get('/tasks', {
        params: { search }
      });
      return res.data;
    },
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage work across your active projects.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="flex justify-between items-center shrink-0">
        <div className="relative w-72">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-md border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}
          >
            <Trello className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">Loading tasks...</div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard tasks={data?.data || []} />
        ) : (
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data?.data?.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.project?.key}-{task.id.slice(0, 4)}</div>
                    </td>
                    <td className="px-6 py-4">{task.status}</td>
                    <td className="px-6 py-4">{task.priority}</td>
                    <td className="px-6 py-4">{task.assignee?.firstName || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
