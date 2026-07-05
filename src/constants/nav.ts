import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserSearch,
  Search,
  Inbox,
  LineChart,
  Network,
  UserCircle,
  Settings,
  LifeBuoy,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional inline tag, e.g. "coming soon" / "beta". Rendered by the sidebar. */
  badge?: string;
  /** When true, the item renders muted and non-navigating (placeholder surfaces). */
  disabled?: boolean;
  badgeVariant?: "default" | "primary";
}

export const RECRUITER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Active Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Applicants", href: "/recruiter/applications", icon: Users },
  { label: "Talent Pool", href: "/recruiter/talent", icon: UserSearch },
];

/*
 * > DEVIATION (p1b Task 1): plan assumed SeekerNavItem/SEEKER_NAV_ITEMS had zero
 * importers — false, SeekerHeader.tsx and Header.tsx consume this iconName-keyed
 * shape for the legacy /seeker/* header nav. Renamed to LegacySeekerNavItem /
 * LEGACY_SEEKER_HEADER_ITEMS to keep the legacy header compiling; SEEKER_NAV_ITEMS
 * below is now the pivot's NavItem[] config for AppSidebar.
 */
export interface LegacySeekerNavItem {
  label: string;
  href: string;
  iconName: string;
}

export const LEGACY_SEEKER_HEADER_ITEMS: LegacySeekerNavItem[] = [
  { label: "Dashboard", href: "/seeker/dashboard", iconName: "layout-dashboard" },
  { label: "Saved Jobs", href: "/seeker/saved-jobs", iconName: "bookmark" },
  { label: "Applied Jobs", href: "/seeker/applications", iconName: "send" },
  { label: "Contact & Support", href: "/contact", iconName: "life-buoy" },
  { label: "Settings", href: "/seeker/settings", iconName: "settings" },
];

/*
 * SEEKER_NAV_ITEMS
 * Sidebar destinations for the pivot seeker shell (route group `(app)`).
 * `badge`/`disabled` mark surfaces that are stubbed this phase and filled later.
 */
export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse jobs", href: "/dashboard/browse", icon: Search },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox, badge: "Soon", disabled: true },
  { label: "Tracker", href: "/dashboard/tracker", icon: LineChart },
  { label: "Networking", href: "/dashboard/networking", icon: Network, badge: "Beta" },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: LifeBuoy },
];
