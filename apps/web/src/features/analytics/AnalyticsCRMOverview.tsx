import React, { useState } from 'react';
import { Title, Grid, Card } from '@tremor/react';
import { FilterPanel } from '../../components/analytics/FilterPanel';
import { MetricCard } from '../../components/analytics/MetricCard';
import { useReport, MetricFilter } from './hooks/useAnalytics';

export const AnalyticsCRMOverview: React.FC = () => {
  const [filters, setFilters] = useState<MetricFilter>({});

  const { data: report, isLoading } = useReport('CRM_OVERVIEW', filters);

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

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">CRM Analytics</h1>
        <p className="text-gray-500 text-sm">Analyze lead generation, win rates, and overall pipeline value.</p>
      </div>

      <FilterPanel onDateChange={handleDateChange} />

      <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-8">
        <MetricCard
          title="Leads Created"
          metric={getMetricValue('Leads Created')}
          isLoading={isLoading}
          color="blue"
        />
        <MetricCard
          title="Pipeline Value"
          metric={isLoading ? '...' : `$${getMetricValue('Pipeline Value').toLocaleString()}`}
          isLoading={isLoading}
          color="emerald"
        />
        <MetricCard
          title="Win Rate"
          metric={isLoading ? '...' : `${getMetricValue('Win Rate')}%`}
          isLoading={isLoading}
          color="amber"
        />
      </Grid>
      
    </div>
  );
};
