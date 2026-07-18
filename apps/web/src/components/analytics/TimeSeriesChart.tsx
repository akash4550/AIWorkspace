import { Card, Title, AreaChart, Text } from '@tremor/react';

interface TimeSeriesChartProps {
  title: string;
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
}

export const TimeSeriesChart = ({
  title,
  data,
  index,
  categories,
  colors = ['blue', 'cyan'],
  valueFormatter,
  isLoading
}: TimeSeriesChartProps) => {
  return (
    <Card>
      <Title>{title}</Title>
      {isLoading ? (
        <div className="h-72 mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <Text>Loading chart data...</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <Text>No data available for this period.</Text>
        </div>
      ) : (
        <AreaChart
          className="h-72 mt-4"
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          valueFormatter={valueFormatter}
          showLegend={true}
        />
      )}
    </Card>
  );
};
