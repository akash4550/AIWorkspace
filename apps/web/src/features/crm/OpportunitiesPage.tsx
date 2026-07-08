import React, { useState } from 'react';
import { Card, Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Button, Flex } from '@tremor/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const mockOpportunities = [
  { id: '1', title: 'Q3 Enterprise Renewal', stage: 'Negotiation', probability: 80, expectedRevenue: 50000, closeDate: '2026-09-30' },
  { id: '2', title: 'Consulting Services', stage: 'Proposal', probability: 40, expectedRevenue: 120000, closeDate: '2026-10-15' },
];

export const OpportunitiesPage: React.FC = () => {
  const [opportunities] = useState(mockOpportunities);

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <Flex className="mb-6">
        <div>
          <Title>Opportunities</Title>
          <Text>Manage your sales pipeline and track revenue.</Text>
        </div>
        <Button icon={PlusIcon} color="blue">Add Opportunity</Button>
      </Flex>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Stage</TableHeaderCell>
              <TableHeaderCell>Probability</TableHeaderCell>
              <TableHeaderCell>Expected Revenue</TableHeaderCell>
              <TableHeaderCell>Close Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{opp.title}</TableCell>
                <TableCell>
                  <Badge color="blue">{opp.stage}</Badge>
                </TableCell>
                <TableCell>{opp.probability}%</TableCell>
                <TableCell>${opp.expectedRevenue.toLocaleString()}</TableCell>
                <TableCell>{opp.closeDate}</TableCell>
                <TableCell>
                  <Button size="xs" variant="secondary" color="gray">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
