import React from 'react';
import { Card, Text, Metric, Flex, Icon, BadgeDelta } from '@tremor/react';

interface MetricCardProps {
  title: string;
  metric: string | number;
  icon?: any; // HeroIcon
  trend?: {
    value: string;
    type: 'increase' | 'moderateIncrease' | 'unchanged' | 'moderateDecrease' | 'decrease';
  };
  color?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose';
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  metric, 
  icon, 
  trend, 
  color = 'blue',
  isLoading 
}) => {
  return (
    <Card decoration="top" decorationColor={color}>
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{isLoading ? '...' : metric}</Metric>
        </div>
        {icon && <Icon icon={icon} variant="light" size="xl" color={color} />}
      </Flex>
      {trend && !isLoading && (
        <Flex className="mt-4">
          <BadgeDelta deltaType={trend.type}>{trend.value}</BadgeDelta>
          <Text className="text-xs text-gray-500 ml-2">vs last period</Text>
        </Flex>
      )}
    </Card>
  );
};
