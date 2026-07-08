import React, { useState } from 'react';
import { Card, Title, Text, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Button, Flex } from '@tremor/react';
import { PlusIcon } from '@heroicons/react/24/outline';

const mockContacts = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@acme.com', phone: '+1 555-0100', designation: 'CEO' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@stark.com', phone: '+1 555-0101', designation: 'CTO' },
];

export const ContactsPage: React.FC = () => {
  const [contacts] = useState(mockContacts);

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <Flex className="mb-6">
        <div>
          <Title>Contacts</Title>
          <Text>Manage directory of all customer contacts.</Text>
        </div>
        <Button icon={PlusIcon} color="blue">Add Contact</Button>
      </Flex>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Designation</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell>{contact.designation}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
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
