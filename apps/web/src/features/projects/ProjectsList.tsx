import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Utility for status colors
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PLANNING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };
  return map[status] || map.PLANNING;
};

export const ProjectsList = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/projects', {
        params: { search, status: statusFilter || undefined }
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your organization's projects.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-md text-sm appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-md border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : data?.data?.length === 0 ? (
        <Card className="text-center py-16">
          <CardBody>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first project.</p>
            <Button variant="primary">Create Project</Button>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.data.map((project: any) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardBody className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                      {project.key}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">{project.name}</h3>
                      <p className="text-xs text-gray-500">{project.key}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 dark:border-slate-700 pt-4 mt-4">
                  <span>Owner: {project.owner?.firstName || 'Unknown'}</span>
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-300 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Key</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((project: any) => (
                <tr key={project.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{project.name}</td>
                  <td className="px-6 py-4">{project.key}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{project.owner?.firstName} {project.owner?.lastName}</td>
                  <td className="px-6 py-4">{new Date(project.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
