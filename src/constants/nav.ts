import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
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
  { label: "Tracker", href: "/dashboard/tracker", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings },
];
