import React from 'react';
import { Card, Title, Text, TabGroup, TabList, Tab, TabPanels, TabPanel, Grid, Flex, Badge, Button } from '@tremor/react';
import { useParams } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock data for display purposes
  const client = {
    name: 'Acme Corp',
    industry: 'Technology',
    status: 'ACTIVE',
    email: 'contact@acme.com',
    phone: '+1 555-0199',
    address: '123 Tech Lane, Silicon Valley',
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <Flex className="mb-6">
        <div>
          <Title className="text-2xl">{client.name}</Title>
          <Text>{client.industry} • {client.status}</Text>
        </div>
        <div className="space-x-2">
          <Button icon={PencilIcon} variant="secondary">Edit</Button>
          <Button icon={TrashIcon} color="red" variant="secondary">Delete</Button>
        </div>
      </Flex>

      <TabGroup>
        <TabList className="mb-4">
          <Tab>Overview</Tab>
          <Tab>Contacts</Tab>
          <Tab>Opportunities</Tab>
          <Tab>Activities</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItemsMd={2} className="gap-6">
              <Card>
                <Title>Client Details</Title>
                <div className="mt-4 space-y-4">
                  <Flex>
                    <Text className="w-1/3 font-medium">Email</Text>
                    <Text className="w-2/3">{client.email}</Text>
                  </Flex>
                  <Flex>
                    <Text className="w-1/3 font-medium">Phone</Text>
                    <Text className="w-2/3">{client.phone}</Text>
                  </Flex>
                  <Flex>
                    <Text className="w-1/3 font-medium">Address</Text>
                    <Text className="w-2/3">{client.address}</Text>
                  </Flex>
                </div>
              </Card>
              <Card>
                <Title>Recent Activity</Title>
                <div className="mt-4">
                  <Text>No activity logged yet.</Text>
                </div>
              </Card>
            </Grid>
          </TabPanel>
          <TabPanel>
            <Card>
              <Title>Associated Contacts</Title>
              <Text className="mt-2">No contacts found for this client.</Text>
            </Card>
          </TabPanel>
          <TabPanel>
            <Card>
              <Title>Opportunities</Title>
              <Text className="mt-2">No active opportunities.</Text>
            </Card>
          </TabPanel>
          <TabPanel>
            <Card>
              <Title>Activity Log</Title>
              <Text className="mt-2">No activities recorded.</Text>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};
