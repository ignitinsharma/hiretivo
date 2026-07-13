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
  { label: "Dashboard", href: "/seeker/dashboard", icon: LayoutDashboard },
  { label: "Generate resume", href: "/seeker/generate-resume", icon: FileText },
  { label: "Browse jobs", href: "/seeker/browse", icon: Search },
  { label: "Tracker", href: "/seeker/tracker", icon: LineChart },
  { label: "Profile", href: "/seeker/profile", icon: UserCircle },
  { label: "Settings", href: "/seeker/settings", icon: Settings },
];
