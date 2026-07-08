import React, { useState } from 'react';
import { Title, Grid, Card, Text } from '@tremor/react';
import { FilterPanel } from '../../components/analytics/FilterPanel';
import { MetricCard } from '../../components/analytics/MetricCard';
import { DistributionChart } from '../../components/analytics/DistributionChart';
import { useReport, MetricFilter } from './hooks/useAnalytics';

export const ProjectDashboard: React.FC = () => {
  const [filters, setFilters] = useState<MetricFilter>({});

  const { data: report, isLoading } = useReport('PROJECT_HEALTH', filters);

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    }));
  };

  const getMetricValue = (name: string) => {
    if (!report || !report.results) return 0;
    const metric = report.results.find((m: any) => m.name === name);
    return metric?.value || 0;
  };

  const getDistributionData = (name: string) => {
    if (!report || !report.results) return [];
    const metric = report.results.find((m: any) => m.name === name);
    return metric?.type === 'distribution' ? metric.value : [];
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Project & Task Dashboard</h1>
        <p className="text-gray-500 text-sm">Monitor project health, task completion, and team velocity.</p>
      </div>

      <FilterPanel onDateChange={handleDateChange} />

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
        <MetricCard
          title="Active Projects"
          metric={getMetricValue('Active Projects')}
          isLoading={isLoading}
          color="blue"
        />
        <MetricCard
          title="Tasks Created"
          metric={getMetricValue('Tasks Created')}
          isLoading={isLoading}
          color="amber"
        />
        <MetricCard
          title="Tasks Completed"
          metric={getMetricValue('Tasks Completed')}
          isLoading={isLoading}
          color="emerald"
        />
        <MetricCard
          title="Completion Rate"
          metric={isLoading ? '...' : `${getMetricValue('Task Completion Rate')}%`}
          isLoading={isLoading}
          color="indigo"
        />
      </Grid>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart
          title="Task Status Distribution"
          data={getDistributionData('Task Statuses')}
          category="value"
          index="category"
          isLoading={isLoading}
        />
        
        <Card>
          <Title>Overdue Tasks Warning</Title>
          <div className="mt-4 flex flex-col items-center justify-center py-6">
            <Text className="text-4xl font-bold text-rose-500">
              {isLoading ? '...' : getMetricValue('Overdue Tasks')}
            </Text>
            <Text className="mt-2 text-gray-500">tasks are currently overdue</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};
