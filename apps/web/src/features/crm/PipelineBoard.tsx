import { useState } from 'react';
import { Title, Text, Card, Flex, Badge } from '@tremor/react';

// Note: In a real implementation, we would use react-beautiful-dnd or dnd-kit for drag and drop
const mockStages = [
  { id: '1', name: 'Lead', probability: 10 },
  { id: '2', name: 'Qualified', probability: 30 },
  { id: '3', name: 'Proposal', probability: 50 },
  { id: '4', name: 'Negotiation', probability: 80 },
  { id: '5', name: 'Won', probability: 100 },
];

const mockOpportunities = [
  { id: '1', title: 'Q3 Enterprise Renewal', expectedRevenue: 50000, stageId: '4' },
  { id: '2', title: 'Consulting Services', expectedRevenue: 120000, stageId: '3' },
  { id: '3', title: 'New Cloud Setup', expectedRevenue: 25000, stageId: '1' },
];

export const PipelineBoard = () => {
  const [stages] = useState(mockStages);
  const [opportunities] = useState(mockOpportunities);

  return (
    <div className="p-6 h-full overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <Title>Pipeline</Title>
        <Text>Visual sales pipeline board.</Text>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
          const totalValue = stageOpps.reduce((sum, opp) => sum + opp.expectedRevenue, 0);

          return (
            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <Flex className="mb-3">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{stage.name}</span>
                <Badge color="blue">{stageOpps.length}</Badge>
              </Flex>
              <Text className="text-xs text-gray-500 mb-4">${totalValue.toLocaleString()} • {stage.probability}% win</Text>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {stageOpps.map((opp) => (
                  <Card key={opp.id} className="p-3 cursor-grab hover:shadow-md transition-shadow">
                    <Text className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">{opp.title}</Text>
                    <Text className="text-sm text-emerald-600 font-semibold">${opp.expectedRevenue.toLocaleString()}</Text>
                  </Card>
                ))}
                {stageOpps.length === 0 && (
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                    <Text className="text-sm">No opportunities</Text>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
