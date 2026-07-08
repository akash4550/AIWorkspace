import React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, Admin!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening in AIWorkspace Demo today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">12</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Active Projects</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-4xl font-bold text-green-600 dark:text-green-400">45</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Completed Tasks</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">8</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Pending Reviews</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center p-6 text-center">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">124</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Total Users</span>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Activity feed placeholder (Phase 7)</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Button variant="primary" className="w-full">Create New Project</Button>
            <Button variant="secondary" className="w-full">Invite User</Button>
            <Button variant="ghost" className="w-full">View Documentation</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
