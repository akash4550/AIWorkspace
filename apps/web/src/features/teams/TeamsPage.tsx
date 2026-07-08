import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TeamCard } from './components/TeamCard';
import { useNavigate } from 'react-router-dom';

export const TeamsPage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['teams', search],
    queryFn: async () => {
      const res = await api.get('/teams', {
        params: { search }
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your organization's teams and members.</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading teams...</div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No teams found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create a team to start collaborating.</p>
          <Button variant="primary">Create Team</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data?.data?.map((team: any) => (
            <TeamCard 
                key={team.id} 
                team={team} 
                onClick={(id) => navigate(`/teams/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
