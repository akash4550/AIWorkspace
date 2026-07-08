import React, { useState } from 'react';
import { Grid } from '@tremor/react';
import { FilterPanel } from '../../components/analytics/FilterPanel';
import { MetricCard } from '../../components/analytics/MetricCard';
import { useMetric, MetricFilter } from './hooks/useAnalytics';

export const TeamDashboard: React.FC = () => {
  const [filters, setFilters] = useState<MetricFilter>({});

  // As a demonstration of individual metric fetching (instead of bundled report)
  const { data: teamActivity, isLoading } = useMetric('TASKS_COMPLETED', filters);

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    }));
  };

  const handleTeamChange = (teamId: string) => {
    setFilters(prev => ({ ...prev, teamId: teamId === 'all' ? undefined : teamId }));
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Team Analytics</h1>
        <p className="text-gray-500 text-sm">Monitor team activity and productivity.</p>
      </div>

      <FilterPanel 
        onDateChange={handleDateChange} 
        onTeamChange={handleTeamChange}
        teams={[{id: 'team-1', name: 'Engineering'}, {id: 'team-2', name: 'Sales'}]}
      />

      <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-8">
        <MetricCard
          title="Team Tasks Completed"
          metric={teamActivity?.value || 0}
          isLoading={isLoading}
          color="blue"
        />
      </Grid>
      
    </div>
  );
};
