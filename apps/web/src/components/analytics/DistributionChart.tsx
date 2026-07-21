import { Card, Title, DonutChart, Text } from '@tremor/react';

interface DistributionChartProps {
  title: string;
  data: any[];
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
}

export const DistributionChart = ({
  title,
  data,
  category,
  index,
  colors = ['slate', 'violet', 'indigo', 'rose', 'cyan', 'amber'],
  valueFormatter,
  isLoading
}: DistributionChartProps) => {
  return (
    <Card>
      <Title>{title}</Title>
      {isLoading ? (
        <div className="h-40 mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <Text>Loading distribution...</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="h-40 mt-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <Text>No data available.</Text>
        </div>
      ) : (
        <DonutChart
          className="h-40 mt-4"
          data={data}
          category={category}
          index={index}
          valueFormatter={valueFormatter}
          colors={colors}
        />
      )}
    </Card>
  );
};
