import React, { useState } from 'react';
import { Title, Grid, Card, Text } from '@tremor/react';
import { FilterPanel } from '../../components/analytics/FilterPanel';
import { MetricCard } from '../../components/analytics/MetricCard';
import { useReport, MetricFilter } from './hooks/useAnalytics';

export const ExecutiveDashboard: React.FC = () => {
  const [filters, setFilters] = useState<MetricFilter>({});

  const { data: report, isLoading } = useReport('EXECUTIVE_SUMMARY', filters);

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    }));
  };

  // Helper to safely extract metric from report bundle
  const getMetricValue = (name: string) => {
    if (!report || !report.results) return 0;
    const metric = report.results.find((m: any) => m.name === name);
    return metric?.value || 0;
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Executive Dashboard</h1>
        <p className="text-gray-500 text-sm">High-level overview of organization health.</p>
      </div>

      <FilterPanel onDateChange={handleDateChange} />

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
        <MetricCard
          title="Active Users"
          metric={getMetricValue('Active Users')}
          isLoading={isLoading}
          color="blue"
        />
        <MetricCard
          title="New Users"
          metric={getMetricValue('New Users')}
          isLoading={isLoading}
          color="emerald"
        />
        <MetricCard
          title="Projects Created"
          metric={getMetricValue('Projects Created')}
          isLoading={isLoading}
          color="amber"
        />
        <MetricCard
          title="Pipeline Value ($)"
          metric={getMetricValue('Pipeline Value')}
          isLoading={isLoading}
          color="indigo"
        />
      </Grid>
      
      {!isLoading && report && (
        <Card className="mt-6">
          <Title>Report Details</Title>
          <Text className="mt-2 text-sm text-gray-500">
            Generated at: {new Date(report.generatedAt).toLocaleString()}
          </Text>
        </Card>
      )}
    </div>
  );
};
