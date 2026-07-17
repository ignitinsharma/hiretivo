import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Search,
  LineChart,
  UserCircle,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: never;
  badgeVariant?: "default" | "primary";
}

export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Generate resume", href: "/generate-resume", icon: FileText },
  { label: "Browse jobs", href: "/dashboard/browse", icon: Search },
  { label: "Tracker", href: "/dashboard/tracker", icon: LineChart },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];
