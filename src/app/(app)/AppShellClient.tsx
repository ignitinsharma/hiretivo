"use client";

import { ReactQueryProvider } from "@/providers/query-provider";
import {
  AppSidebarProvider,
  useSidebarState,
} from "@/components/layout/AppSidebar";
import { CreditsWidget } from "@/components/layout/CreditsWidget";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";

interface AppShellClientProps {
  children: React.ReactNode;
}

/*
 * SidebarCreditsSlot
 * Reads collapse state from SidebarContext and renders the static credits
 * widget. Separate consumer so it can access the context provided above it.
 * Phase 8 replaces the hardcoded numbers with a live subscription query.
 */
function SidebarCreditsSlot() {
  const { collapsed } = useSidebarState();
  return (
    <CreditsWidget
      creditsLeft={8}
      creditsTotal={8}
      planLabel="Free"
      collapsed={collapsed}
    />
  );
}

/*
 * AppShellClient
 * Client boundary for the (app) route group: query provider + config-driven
 * sidebar with the seeker nav and a static credits widget. Mirrors
 * RecruiterLayoutClient; the server layout runs AuthGuard above this.
 */
export function AppShellClient({ children }: AppShellClientProps) {
  return (
    <div className="min-h-screen bg-brand-surface">
      <ReactQueryProvider>
        <AppSidebarProvider
          navItems={SEEKER_NAV_ITEMS}
          homeHref="/dashboard"
          bottomSlot={<SidebarCreditsSlot />}
        >
          {children}
        </AppSidebarProvider>
      </ReactQueryProvider>
    </div>
  );
}
