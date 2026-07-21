import { useState } from 'react';
import { Card, Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Button, Flex } from '@tremor/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const mockLeads = [
  { id: '1', title: 'Q3 Enterprise Renewal', source: 'Website', status: 'NEW', score: 85, expectedValue: 50000 },
  { id: '2', title: 'Consulting Services', source: 'Referral', status: 'QUALIFIED', score: 92, expectedValue: 120000 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'NEW': return 'blue';
    case 'CONTACTED': return 'yellow';
    case 'QUALIFIED': return 'emerald';
    case 'UNQUALIFIED': return 'red';
    case 'CONVERTED': return 'purple';
    default: return 'gray';
  }
};

export const LeadsPage = () => {
  const [leads] = useState(mockLeads);

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <Flex className="mb-6">
        <div>
          <Title>Leads</Title>
          <Text>Manage prospective customers and opportunities.</Text>
        </div>
        <Button icon={PlusIcon} color="blue">Add Lead</Button>
      </Flex>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Score</TableHeaderCell>
              <TableHeaderCell>Expected Value</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{lead.title}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>
                  <Badge color={lead.score > 80 ? 'emerald' : 'yellow'}>{lead.score}</Badge>
                </TableCell>
                <TableCell>${lead.expectedValue.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge color={getStatusColor(lead.status)}>{lead.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="xs" variant="secondary" color="gray">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
