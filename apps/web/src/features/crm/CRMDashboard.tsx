import { useMemo } from 'react';
import { Card, Title, Text, Metric, Grid, Flex, Icon, Button } from '@tremor/react';
import { Link } from 'react-router-dom';
import { UsersIcon, BriefcaseIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { useClients, useOpportunities, useActivities } from './hooks/useCRMQueries';

export const CRMDashboard = () => {
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: opportunities, isLoading: isLoadingOpps } = useOpportunities();
  const { data: activities, isLoading: isLoadingActivities } = useActivities();

  const totalClients = clients?.length || 0;

  const activeOpportunities = useMemo(() => {
    return opportunities?.filter((opp) => opp.status === 'OPEN').length || 0;
  }, [opportunities]);

  const pipelineValue = useMemo(() => {
    return opportunities?.filter((opp) => opp.status === 'OPEN').reduce((sum, opp) => sum + (opp.value || 0), 0) || 0;
  }, [opportunities]);

  const conversionRate = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return 0;
    const won = opportunities.filter((opp) => opp.status === 'WON').length;
    return Math.round((won / opportunities.length) * 100);
  }, [opportunities]);

  const recentActivities = useMemo(() => {
    return activities?.filter((a) => a.status === 'COMPLETED').slice(0, 5) || [];
  }, [activities]);

  const upcomingTasks = useMemo(() => {
    return activities?.filter((a) => a.status === 'PENDING').slice(0, 5) || [];
  }, [activities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">CRM Dashboard</h1>
        <p className="text-gray-500 text-sm mb-4">Overview of your sales pipeline and customer relationships.</p>
        
        <div className="flex space-x-2">
          <Link to="/crm/clients"><Button size="xs" variant="secondary">Clients</Button></Link>
          <Link to="/crm/contacts"><Button size="xs" variant="secondary">Contacts</Button></Link>
          <Link to="/crm/leads"><Button size="xs" variant="secondary">Leads</Button></Link>
          <Link to="/crm/opportunities"><Button size="xs" variant="secondary">Opportunities</Button></Link>
          <Link to="/crm/pipeline"><Button size="xs" color="blue">Pipeline Board</Button></Link>
        </div>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
        <Card decoration="top" decorationColor="blue">
          <Flex alignItems="start">
            <div>
              <Text>Total Clients</Text>
              <Metric>{isLoadingClients ? '...' : totalClients}</Metric>
            </div>
            <Icon icon={UsersIcon} variant="light" size="xl" color="blue" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text>Active Opportunities</Text>
              <Metric>{isLoadingOpps ? '...' : activeOpportunities}</Metric>
            </div>
            <BriefcaseIcon className="h-10 w-10 text-emerald-500 opacity-20" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Flex alignItems="start">
            <div>
              <Text>Pipeline Value</Text>
              <Metric>{isLoadingOpps ? '...' : formatCurrency(pipelineValue)}</Metric>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-amber-500 opacity-20" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="indigo">
          <Flex alignItems="start">
            <div>
              <Text>Conversion Rate</Text>
              <Metric>{isLoadingOpps ? '...' : `${conversionRate}%`}</Metric>
            </div>
            <PresentationChartLineIcon className="h-10 w-10 text-indigo-500 opacity-20" />
          </Flex>
        </Card>
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title>Recent Activities</Title>
          <div className="mt-4 space-y-4">
            {isLoadingActivities ? (
              <Text>Loading...</Text>
            ) : recentActivities.length > 0 ? (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.description}</span>
                  <span className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <Text>No recent activities found.</Text>
            )}
          </div>
        </Card>
        <Card>
          <Title>Upcoming Tasks</Title>
          <div className="mt-4 space-y-4">
            {isLoadingActivities ? (
              <Text>Loading...</Text>
            ) : upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <div key={task.id} className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.description}</span>
                  <span className="text-xs text-gray-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              ))
            ) : (
              <Text>No upcoming tasks found.</Text>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
