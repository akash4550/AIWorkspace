import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ForbiddenError, NotFoundError } from './features/errors/ErrorPages';
import { Dashboard } from './features/dashboard/Dashboard';
import { OrganizationSettings } from './features/orgs/OrganizationSettings';
import { UserManagement } from './features/users/UserManagement';
import { ProjectsList } from './features/projects/ProjectsList';
import { TasksPage } from './features/tasks/TasksPage';
import { TeamsPage } from './features/teams/TeamsPage';
import { TeamDetailsPage } from './features/teams/TeamDetailsPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { CRMDashboard } from './features/crm/CRMDashboard';
import { ClientsPage } from './features/crm/ClientsPage';
import { ClientDetailPage } from './features/crm/ClientDetailPage';
import { ContactsPage } from './features/crm/ContactsPage';
import { LeadsPage } from './features/crm/LeadsPage';
import { OpportunitiesPage } from './features/crm/OpportunitiesPage';
import { PipelineBoard } from './features/crm/PipelineBoard';
import { SocketProvider } from './providers/SocketProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AnalyticsLayout } from './features/analytics/AnalyticsLayout';
import { JobsDashboard } from './features/system/JobsDashboard';
import { SearchResultsPage } from './features/search/SearchResultsPage';
import { LandingPage } from './pages/LandingPage';

const queryClient = new QueryClient();

// Placeholder Login Page for Unauthenticated users
const Login = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md w-96 text-center">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">AIWorkspace Login</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Phase 4 (Auth) is mocked.</p>
      <button 
        onClick={() => { window.location.href = '/' }} 
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign In as Demo Admin
      </button>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* All authenticated roles can access these features */}
                  <Route path="/projects" element={<ProjectsList />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/teams/:id" element={<TeamDetailsPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="crm" element={<CRMDashboard />} />
                  <Route path="crm/clients" element={<ClientsPage />} />
                  <Route path="crm/clients/:id" element={<ClientDetailPage />} />
                  <Route path="crm/contacts" element={<ContactsPage />} />
                  <Route path="crm/leads" element={<LeadsPage />} />
                  <Route path="crm/opportunities" element={<OpportunitiesPage />} />
                  <Route path="crm/pipeline" element={<PipelineBoard />} />
                  <Route path="analytics" element={<AnalyticsLayout />} />
                  <Route path="search" element={<SearchResultsPage />} />

                  {/* Role Protected Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />}>
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/organization" element={<OrganizationSettings />} />
                  </Route>
                  
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
                    <Route path="/settings" element={<OrganizationSettings />} />
                  </Route>
                  
                  <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                    <Route path="/system/jobs" element={<JobsDashboard />} />
                  </Route>
                </Route>
              </Route>

              {/* Error Routes */}
              <Route path="/403" element={<ForbiddenError />} />
              <Route path="*" element={<NotFoundError />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
