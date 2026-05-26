import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserSearch,
  Settings,
  User,
  Bookmark,
  Send,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Badge is now rendered dynamically by the sidebar component, not from static config. */
  badge?: never;
  badgeVariant?: "default" | "primary";
}

/*
 * RECRUITER_NAV_ITEMS
 * Sidebar nav for authenticated recruiters in the pivot v2 talent marketplace.
 */
export const RECRUITER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Talent Pool", href: "/recruiter/talent", icon: UserSearch },
  { label: "My Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Applications", href: "/recruiter/applications", icon: Users },
  { label: "Settings", href: "/recruiter/settings", icon: Settings },
];

export interface SeekerNavItem {
  label: string;
  href: string;
  iconName: string;
}

/*
 * SEEKER_NAV_ITEMS
 * Sidebar nav for authenticated engineers (seekers) in the pivot v2 product.
 */
export const SEEKER_NAV_ITEMS: SeekerNavItem[] = [
  { label: "Dashboard", href: "/seeker/dashboard", iconName: "layout-dashboard" },
  { label: "Saved Jobs", href: "/seeker/saved-jobs", iconName: "bookmark" },
  { label: "Applied", href: "/seeker/applications", iconName: "send" },
  { label: "Settings", href: "/seeker/settings", iconName: "settings" },
];

export interface PublicNavItem {
  label: string;
  href: string;
}

/*
 * PUBLIC_NAV_ITEMS
 * Header nav for unauthenticated visitors on the talent marketplace landing pages.
 */
export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { label: "Find Engineers", href: "/auth/signup?role=recruiter" },
  { label: "For Engineers", href: "/auth/signup?role=seeker" },
  { label: "Pricing", href: "/pricing" },
];
