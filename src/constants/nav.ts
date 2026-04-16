import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const RECRUITER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Active Jobs', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Applicants', href: '/recruiter/applications', icon: Users },
];

export interface SeekerNavItem {
  label: string;
  href: string;
}

export const SEEKER_NAV_ITEMS: SeekerNavItem[] = [
  { label: 'Jobs', href: '/seeker/dashboard' },
  { label: 'Applied Jobs', href: '/seeker/applications' },
];