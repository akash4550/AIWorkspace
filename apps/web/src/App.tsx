import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { AuthProvider } from './providers/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ThemeProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
              
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
            </ThemeProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
