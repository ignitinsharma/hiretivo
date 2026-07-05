"use client";

import { useSession } from "next-auth/react";
import { ReactQueryProvider } from "@/providers/query-provider";
import {
  AppSidebarProvider,
  useSidebarState,
} from "@/components/layout/AppSidebar";
import { CreditsWidget, CreditsWidgetSkeleton } from "@/components/layout/CreditsWidget";
import { SEEKER_NAV_ITEMS } from "@/constants/nav";
import { useCreditStatus } from "@/modules/seeker/dashboard/hooks/use-credit-status";
import { PLAN_DISPLAY_NAMES } from "@/lib/billing/ai-daily-limit";
import { PlanTier } from "@/constants/enums";

interface AppShellClientProps {
  children: React.ReactNode;
}

/*
 * SidebarCreditsSlot
 * Reads collapse state from SidebarContext and renders the live credits
 * widget — remaining/limit from useCreditStatus (GET /api/seeker/credits,
 * query key seeker-credit-status), the same hook + cache CreditsBanner uses
 * so the two never disagree. Loading renders a pulse skeleton; an errored
 * fetch hides the widget entirely (non-critical — must not block the sidebar).
 */
function SidebarCreditsSlot() {
  const { collapsed } = useSidebarState();
  const { data: session } = useSession();
  const { data, isLoading, isError } = useCreditStatus();

  if (isLoading) {
    return <CreditsWidgetSkeleton collapsed={collapsed} />;
  }

  if (isError || !data) {
    return null;
  }

  // session.user.plan is @prisma/client's PlanTier (next-auth.d.ts augmentation);
  // app code uses the mirrored src/constants/enums.ts PlanTier (same string
  // values, distinct nominal type) — cast at this boundary only.
  const plan = (session?.user?.plan as unknown as PlanTier) ?? PlanTier.FREE;
  const planLabel = PLAN_DISPLAY_NAMES[plan];

  return (
    <CreditsWidget
      creditsLeft={data.remaining}
      creditsTotal={data.limit}
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
