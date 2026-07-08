import React, { useState } from 'react';
import { Title, Grid, Card, Text, Badge, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { useQueueStatus, useRetryJobs, useFailedJobs } from './hooks/useJobs';
import { Play } from 'lucide-react';

export const JobsDashboard: React.FC = () => {
  const { data: queues, isLoading } = useQueueStatus();
  const retryMutation = useRetryJobs();
  
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const { data: failedJobs } = useFailedJobs(selectedQueue || '');

  const handleRetry = (queueName: string) => {
    retryMutation.mutate(queueName);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Background Jobs Monitoring</h1>
          <p className="text-gray-500 text-sm">Monitor BullMQ queues and worker health.</p>
        </div>
      </div>

      <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-8">
        {isLoading ? (
          <Text>Loading queues...</Text>
        ) : (
          queues?.map(queue => (
            <Card key={queue.name} decoration="top" decorationColor={queue.counts.failed > 0 ? 'rose' : 'blue'}>
              <div className="flex justify-between items-start mb-4">
                <Title>{queue.name}</Title>
                <Badge color={queue.counts.failed > 0 ? 'rose' : 'emerald'}>
                  {queue.counts.active > 0 ? 'Active' : 'Idle'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Text className="text-gray-500">Waiting</Text>
                  <Text className="text-xl font-medium">{queue.counts.waiting}</Text>
                </div>
                <div>
                  <Text className="text-gray-500">Active</Text>
                  <Text className="text-xl font-medium text-blue-600">{queue.counts.active}</Text>
                </div>
                <div>
                  <Text className="text-gray-500">Completed</Text>
                  <Text className="text-xl font-medium text-emerald-600">{queue.counts.completed}</Text>
                </div>
                <div>
                  <Text className="text-gray-500">Failed</Text>
                  <Text className="text-xl font-medium text-rose-600">{queue.counts.failed}</Text>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="xs" 
                  variant="secondary"
                  onClick={() => setSelectedQueue(queue.name)}
                >
                  View Failed
                </Button>
                {queue.counts.failed > 0 && (
                  <Button 
                    size="xs" 
                    icon={Play} 
                    color="rose"
                    loading={retryMutation.isPending}
                    onClick={() => handleRetry(queue.name)}
                  >
                    Retry Failed
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </Grid>

      {selectedQueue && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title>Failed Jobs: {selectedQueue}</Title>
            <Button size="xs" variant="light" onClick={() => setSelectedQueue(null)}>Close</Button>
          </div>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Failed Reason</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {failedJobs?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.id}</TableCell>
                  <TableCell>{job.name}</TableCell>
                  <TableCell className="text-rose-600 max-w-md truncate" title={job.failedReason}>
                    {job.failedReason}
                  </TableCell>
                  <TableCell>{new Date(job.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(!failedJobs || failedJobs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    No failed jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
