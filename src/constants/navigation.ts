import {
  LayoutDashboard,
  Ticket,
  ClipboardList,
  Users,
  SlidersHorizontal,
  FolderOpen,
  Layers,
  LayoutGrid,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

export interface NavLeaf {
  type: 'item';
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  clientHidden?: boolean;  // hidden for CLIENT role
  adminOnly?: boolean;     // visible only for ADMIN role
}

export interface NavGroup {
  type: 'group';
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
  adminOnly?: boolean;
}

export type NavEntry = NavLeaf | NavGroup;

/** Main navigation — order is strict */
export const NAV_ENTRIES: NavEntry[] = [
  {
    type: 'item',
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    type: 'item',
    id: 'my-work',
    label: 'My Work',
    path: '/my-work',
    icon: ClipboardList,
    clientHidden: true,
  },
  {
    type: 'item',
    id: 'tickets',
    label: 'Tickets',
    path: '/tickets',
    icon: Ticket,
    clientHidden: true,
  },
  {
    type: 'item',
    id: 'users',
    label: 'User Management',
    path: '/users',
    icon: Users,
    adminOnly: true,
  },
  {
    type: 'group',
    id: 'configurations',
    label: 'Configurations',
    icon: SlidersHorizontal,
    adminOnly: true,
    children: [
      {
        type: 'item',
        id: 'projects',
        label: 'Projects',
        path: '/configurations/projects',
        icon: FolderOpen,
      },
      {
        type: 'item',
        id: 'services',
        label: 'Services',
        path: '/configurations/services',
        icon: Layers,
      },
      {
        type: 'item',
        id: 'centregrid',
        label: 'CentreGrid',
        path: '/configurations/centregrid',
        icon: LayoutGrid,
      },
    ],
  },
];

/** Jobs — always the LAST nav item */
export const NAV_JOBS: NavLeaf = {
  type: 'item',
  id: 'jobs',
  label: 'Jobs',
  path: '/jobs',
  icon: Briefcase,
};
