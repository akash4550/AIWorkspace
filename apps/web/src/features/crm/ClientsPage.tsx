import React, { useState } from 'react';
import { Card, Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Button, Flex } from '@tremor/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const mockClients = [
  { id: '1', name: 'Acme Corp', industry: 'Technology', email: 'contact@acme.com', status: 'ACTIVE' },
  { id: '2', name: 'Stark Industries', industry: 'Defense', email: 'tony@stark.com', status: 'ACTIVE' },
  { id: '3', name: 'Wayne Enterprises', industry: 'Investment', email: 'bruce@wayne.com', status: 'INACTIVE' },
];

export const ClientsPage: React.FC = () => {
  const [clients] = useState(mockClients);

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <Flex className="mb-6">
        <div>
          <Title>Clients</Title>
          <Text>Manage your customer organizations.</Text>
        </div>
        <Button icon={PlusIcon} color="blue">Add Client</Button>
      </Flex>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Industry</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">{client.name}</TableCell>
                <TableCell>{client.industry}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <Badge color={client.status === 'ACTIVE' ? 'emerald' : 'gray'}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link to={`/crm/clients/${client.id}`}>
                    <Button size="xs" variant="secondary" color="gray">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
