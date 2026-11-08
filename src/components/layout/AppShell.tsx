"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { CalendarDays, FileText, LayoutDashboard, LineChart, Moon, Plus, Settings, Sun } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useUIStore } from "@/store/use-ui-store";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tracker", href: "/dashboard/tracker", icon: LineChart },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
  defaultSidebarOpen: boolean;
}

/*
 * AppNavigation renders the authenticated product routes and closes the mobile
 * drawer after a route is chosen. The current route stays visible to assistive tech.
 */
function AppNavigation() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <nav aria-label="Main navigation">
      <SidebarMenu>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                <Link href={href} aria-current={isActive ? "page" : undefined} onClick={() => isMobile && setOpenMobile(false)}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}

/* ThemeButton switches and persists the app-wide appearance preference. */
function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4 shrink-0" aria-hidden="true" /> : <Moon className="size-4 shrink-0" aria-hidden="true" />}
      <span className="group-data-[collapsible=icon]:sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

/* AppShell gives signed-in users a responsive, persistent product navigation. */
export function AppShell({ children, defaultSidebarOpen }: AppShellProps) {
  const openAddCustomJobModal = useUIStore((state) => state.openAddCustomJobModal);
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3">Skip to main content</a>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <Link href="/dashboard" className="flex min-h-11 items-center gap-2 overflow-hidden rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-sidebar-ring" aria-label="Hiretivo dashboard">
            <Logo size="sm" className="shrink-0 dark:brightness-0 dark:invert" />
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-3">
          <AppNavigation />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <ThemeButton />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <SidebarTrigger aria-label="Toggle sidebar" className="size-9" />
          <span className="text-sm font-semibold text-foreground">Hiretivo</span>
          <button type="button" onClick={openAddCustomJobModal} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-primary px-3 text-sm font-medium text-white hover:bg-brand-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
            <Plus className="size-4" aria-hidden="true" />
            Add job
          </button>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
