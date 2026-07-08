import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  FolderKanban, 
  CheckSquare, 
  UsersRound, 
  Calendar, 
  FileText, 
  Bell, 
  LineChart, 
  Bot,
  Activity
} from 'lucide-react';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[]; // If undefined, available to all
  disabled?: boolean;
}

export const navigationConfig: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/teams', label: 'Teams', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/organization', label: 'Organization', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  
  // Future placeholders
  { path: '/crm', label: 'CRM', icon: UsersRound, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/calendar', label: 'Calendar', icon: Calendar, disabled: true },
  { path: '/documents', label: 'Documents', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, disabled: true },
  { path: '/analytics', label: 'Analytics', icon: LineChart, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, disabled: true },

  { path: '/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/system/jobs', label: 'Background Jobs', icon: Activity, roles: ['SUPER_ADMIN'] },
];
