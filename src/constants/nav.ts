import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserSearch,
  BarChart3,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'primary';
}

export const RECRUITER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Active Jobs', href: '/recruiter/jobs', icon: Briefcase, badge: '8' },
  { label: 'Applicants', href: '/recruiter/applications', icon: Users, badge: '12', badgeVariant: 'primary' },
  { label: 'Talent Pool', href: '/recruiter/talent', icon: UserSearch },
  { label: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/recruiter/settings', icon: Settings },
];

export interface SeekerNavItem {
  label: string;
  href: string;
}

export const SEEKER_NAV_ITEMS: SeekerNavItem[] = [
  { label: 'Jobs', href: '/seeker/dashboard' },
  { label: 'Applied Jobs', href: '/seeker/applications' },
  { label: 'Settings', href: '/seeker/settings' },
];
