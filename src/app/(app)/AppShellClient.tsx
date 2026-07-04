"use client";

import { useSession } from "next-auth/react";
import { ReactQueryProvider } from "@/providers/query-provider";
import {
  AppSidebarProvider,
  useSidebarState,
} from "@/components/layout/AppSidebar";
import { CreditsWidget } from "@/components/layout/CreditsWidget";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import { useCredits } from "@/hooks/use-credits";
import { PLAN_DISPLAY_NAMES } from "@/lib/billing/ai-daily-limit";
import { PlanTier } from "@/constants/enums";

interface AppShellClientProps {
  children: React.ReactNode;
}

/*
 * SidebarCreditsSlot
 * Reads collapse state from SidebarContext and renders the live credits
 * widget (Phase 8) — remaining/limit from GET /api/seeker/credits, plan
 * label from the session. Loading/error fall back to a 0/1 bar so the
 * widget never claims full credits before data arrives.
 */
function SidebarCreditsSlot() {
  const { collapsed } = useSidebarState();
  const { data: session } = useSession();
  const { data: creditsData, isLoading } = useCredits();

  // session.user.plan is @prisma/client's PlanTier (next-auth.d.ts augmentation);
  // app code uses the mirrored src/constants/enums.ts PlanTier (same string
  // values, distinct nominal type) — cast at this boundary only.
  const plan = (session?.user?.plan as unknown as PlanTier) ?? PlanTier.FREE;
  const planLabel = PLAN_DISPLAY_NAMES[plan];
  const creditsLeft = isLoading || !creditsData ? 0 : creditsData.data.remaining;
  const creditsTotal = isLoading || !creditsData ? 1 : creditsData.data.limit;

  return (
    <CreditsWidget
      creditsLeft={creditsLeft}
      creditsTotal={creditsTotal}
      planLabel={planLabel}
      collapsed={collapsed}
    />
  );
}

/*
 * AppShellClient
 * Client boundary for the (app) route group: query provider + config-driven
 * sidebar with the seeker nav and a live credits widget. Mirrors
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
