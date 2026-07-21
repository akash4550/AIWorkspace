import { useState } from 'react';
import { TabGroup, TabList, Tab } from '@tremor/react';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { ProjectDashboard } from './ProjectDashboard';
import { AnalyticsCRMOverview } from './AnalyticsCRMOverview';
import { TeamDashboard } from './TeamDashboard';

export const AnalyticsLayout = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analytics Platform</h1>
        <TabGroup index={selectedIndex} onIndexChange={setSelectedIndex}>
          <TabList variant="line">
            <Tab>Executive</Tab>
            <Tab>Projects & Tasks</Tab>
            <Tab>CRM</Tab>
            <Tab>Teams</Tab>
          </TabList>
        </TabGroup>
      </div>

      <div className="flex-1 overflow-auto">
        {/* We do conditional rendering manually to ensure hooks in inactive tabs don't fire if unnecessary, though TabPanels handles it too */}
        {selectedIndex === 0 && <ExecutiveDashboard />}
        {selectedIndex === 1 && <ProjectDashboard />}
        {selectedIndex === 2 && <AnalyticsCRMOverview />}
        {selectedIndex === 3 && <TeamDashboard />}
      </div>
    </div>
  );
};
