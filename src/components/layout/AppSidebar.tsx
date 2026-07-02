"use client";

import React, { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import type { NavItem } from "@/constants/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

/*
 * useSidebarState
 * Reads collapse state + toggle for the app sidebar.
 */
export function useSidebarState() {
  return useContext(SidebarContext);
}

/*
 * SidebarToggle
 * Toggles the app sidebar between expanded and icon-only states.
 */
export function SidebarToggle({ className }: { className?: string }) {
  const { toggle } = useSidebarState();
  return (
    <button
      onClick={toggle}
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center text-brand-foreground-muted hover:bg-brand-surface hover:text-brand-foreground transition-colors",
        className,
      )}
      title="Toggle sidebar"
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="w-5 h-5" />
    </button>
  );
}

interface AppSidebarProviderProps {
  navItems: NavItem[];
  homeHref: string;
  bottomSlot?: React.ReactNode;
  children: React.ReactNode;
}

/*
 * AppSidebarProvider
 * Provides sidebar collapse state and renders the config-driven AppSidebar
 * beside the page <main>. Generalized from RecruiterSidebarProvider.
 * @param navItems  - destinations to render
 * @param homeHref  - logo link target
 * @param bottomSlot- optional node pinned above the sidebar footer (e.g. CreditsWidget)
 */
export function AppSidebarProvider({
  navItems,
  homeHref,
  bottomSlot,
  children,
}: AppSidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="flex min-h-screen">
        <AppSidebarInner
          collapsed={collapsed}
          navItems={navItems}
          homeHref={homeHref}
          bottomSlot={bottomSlot}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}

interface AppSidebarInnerProps {
  collapsed: boolean;
  navItems: NavItem[];
  homeHref: string;
  bottomSlot?: React.ReactNode;
}

const TOOLTIP_CLASSES =
  "rounded-lg border border-brand-border bg-white text-brand-foreground font-medium";

/*
 * AppSidebarInner
 * Renders logo, config-driven navigation, and an optional bottom slot.
 * Disabled nav items render muted and non-navigating (placeholder surfaces).
 */
function AppSidebarInner({
  collapsed,
  navItems,
  homeHref,
  bottomSlot,
}: AppSidebarInnerProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 h-screen bg-white border-r border-brand-border flex flex-col shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-17" : "w-65",
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn("px-5 py-5 flex items-center gap-3", collapsed && "justify-center px-0")}>
          {collapsed ? (
            <SidebarToggle />
          ) : (
            <>
              <Link href={homeHref} className="flex min-w-0 flex-1 items-center">
                <Logo />
              </Link>
              <SidebarToggle className="shrink-0" />
            </>
          )}
        </div>

        <div className="mx-4 h-px bg-brand-border opacity-60" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <AppSidebarLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
            />
          ))}
        </nav>

        {/* Bottom slot (e.g. CreditsWidget) */}
        {bottomSlot}
      </aside>
    </TooltipProvider>
  );
}

interface AppSidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}

/*
 * AppSidebarLink
 * One nav row. Disabled items render as a muted, non-navigating span with an
 * optional badge; enabled items render a Link with active-state styling.
 */
function AppSidebarLink({ item, collapsed, isActive }: AppSidebarLinkProps) {
  const Icon = item.icon;

  const rowClasses = cn(
    "relative flex items-center py-2.5 text-sm transition-all border-l-[3px] rounded-r-md",
    collapsed ? "justify-center px-0 border-l-0 rounded-md mx-1" : "justify-between px-3",
    item.disabled
      ? "cursor-default border-transparent text-brand-foreground-secondary"
      : isActive
        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
        : "border-transparent text-brand-foreground-muted hover:bg-brand-surface hover:text-brand-foreground font-medium",
  );

  const inner = (
    <>
      <div className={cn("flex items-center", collapsed ? "gap-0" : "gap-3")}>
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </div>
      {!collapsed && item.badge && (
        <span className="rounded bg-brand-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground-secondary">
          {item.badge}
        </span>
      )}
    </>
  );

  const row = item.disabled ? (
    <span className={rowClasses} aria-disabled>
      {inner}
    </span>
  ) : (
    <Link href={item.href} className={rowClasses}>
      {inner}
    </Link>
  );

  if (!collapsed) return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" className={TOOLTIP_CLASSES}>
        {item.label}
        {item.badge ? ` · ${item.badge}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
