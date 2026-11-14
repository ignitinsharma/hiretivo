import { Bot, BriefcaseBusiness, FileText, Gauge, House, Rocket, Search, Settings, type LucideIcon } from "lucide-react";

// The app's sections, shared by the sidebar and the page bar so they always agree.

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether the item is the current section; defaults to its own path and below. */
  isActive?: (pathname: string) => boolean;
};

const within = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/** The sections, in the order the sidebar lists them. */
export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: House, isActive: (pathname) => pathname === "/" || pathname === "/dashboard" },
  { href: "/resume", label: "Resume", icon: FileText, isActive: (pathname) => within(pathname, "/resume") || within(pathname, "/profile") },
  { href: "/jobs", label: "Find jobs", icon: Search },
  { href: "/startups", label: "Startups", icon: Rocket },
  { href: "/agent", label: "Agent", icon: Bot },
  {
    href: "/applications",
    label: "Applications",
    icon: BriefcaseBusiness,
    // A new application becomes one, so the flow belongs to Applications.
    isActive: (pathname) => within(pathname, "/applications") || within(pathname, "/new"),
  },
  { href: "/settings", label: "Settings", icon: Settings },
  // Tokens used per AI task (#290).
  { href: "/usage", label: "Usage", icon: Gauge },
];

export const isCurrent = ({ href, isActive = (path) => within(path, href) }: NavItem, pathname: string) => isActive(pathname);

/** The section a path belongs to, for the page bar's title; undefined outside them all. */
export function currentSection(pathname: string): NavItem | undefined {
  return NAV.find((item) => isCurrent(item, pathname));
}
