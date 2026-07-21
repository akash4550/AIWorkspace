import { MetricFilterDto } from './analytics.dto';

export type { MetricFilterDto };
export type TimeSeriesDataPoint = {
  date: string;
  value: number;
};

export type CategoryDataPoint = {
  category: string;
  value: number;
};

export type MetricResult = {
  name: string;
  value: number | string | TimeSeriesDataPoint[] | CategoryDataPoint[];
  type: 'scalar' | 'time_series' | 'distribution';
  description?: string;
  unit?: string;
};

export type KPIFunction = (
  organizationId: string,
  filters: MetricFilterDto
) => Promise<MetricResult>;

export interface ReportDefinition {
  type: string;
  title: string;
  description: string;
  metrics: string[]; // List of metric names to include in this report
}
