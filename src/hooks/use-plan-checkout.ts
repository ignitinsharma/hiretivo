"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingService } from "@/services/billing.service";
import { BillingPeriod, PlanTier, PricingTierId } from "@/constants/enums";
import { useUIStore } from "@/store/use-ui-store";

const CLIENT_PLAN_RANK: Record<string, number> = { FREE: 0, STARTER: 1, GROWTH: 2, SCALE: 3 };

export interface PlanChangeModalState {
  open: boolean;
  mode: "upgrade" | "downgrade";
  targetPlan: string;
  targetPlanId: string;
  period: BillingPeriod;
}

/*
 * usePlanCheckout
 * Shared checkout/upgrade/downgrade/portal-redirect logic for anywhere a
 * seeker can act on a plan tier — the public pricing page and the settings
 * Plans tab (2+ rule; the billing flow must not be duplicated). Resolves the
 * current plan from subscription-status (DB-backed, avoids a stale-JWT
 * "current plan" badge), and routes FREE-tier clicks, portal redirects for
 * the current plan, plan-change modal for switching paid tiers, and Dodo
 * checkout for a first upgrade.
 * @param returnTo - optional allowlisted path Dodo checkout redirects back to on success
 */
export function usePlanCheckout(returnTo?: string) {
  const [pendingTier, setPendingTier] = useState<string | null>(null);
  const [planChangeModal, setPlanChangeModal] = useState<PlanChangeModalState | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { openLoginModal } = useUIStore();

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: billingService.getSubscriptionStatus,
    staleTime: 60_000,
    enabled: !!session?.user,
  });
  const userPlan = (subscriptionStatus?.plan ?? session?.user?.plan) as PlanTier | undefined;

  async function handleCtaClick(tierId: string, isAnnual: boolean) {
    if (tierId === PricingTierId.FREE) {
      router.push(session?.user ? "/dashboard" : "/register");
      return;
    }

    if (!session?.user) {
      openLoginModal();
      return;
    }

    const isPaidTier = tierId === PricingTierId.STARTER || tierId === PricingTierId.GROWTH;
    const planMatchesTier =
      (userPlan === PlanTier.STARTER && tierId === PricingTierId.STARTER) ||
      (userPlan === PlanTier.GROWTH && tierId === PricingTierId.GROWTH) ||
      (userPlan === PlanTier.SCALE && tierId === PricingTierId.GROWTH);

    // Current-plan holder → open billing portal
    if (planMatchesTier) {
      setPendingTier(tierId);
      try {
        const res = await fetch("/api/billing/portal", { method: "POST" });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Could not open billing portal"); return; }
        window.location.href = json.data.url;
      } catch {
        toast.error("Network error. Try again.");
      } finally {
        setPendingTier(null);
      }
      return;
    }

    // Paid user clicking a different paid tier → open plan change modal
    if (isPaidTier && userPlan && userPlan !== PlanTier.FREE) {
      const TIER_NAMES: Record<string, string> = { starter: "Pro", growth: "Max" };
      // Determine direction client-side for UX (server re-validates via getPlanChangeDirection)
      const currentRank = CLIENT_PLAN_RANK[userPlan] ?? 0;
      const targetRank = CLIENT_PLAN_RANK[tierId.toUpperCase()] ?? 0;
      const mode = targetRank > currentRank ? "upgrade" : "downgrade";
      setPlanChangeModal({
        open: true,
        mode,
        targetPlan: TIER_NAMES[tierId] ?? tierId,
        targetPlanId: tierId,
        period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
      });
      return;
    }

    if (!isPaidTier) return;

    // FREE user clicking a paid tier → initiate checkout
    setPendingTier(tierId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: tierId,
          period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
          currency: "USD",
          ...(returnTo ? { returnTo } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Checkout failed. Try again."); return; }
      window.location.href = json.data.url;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setPendingTier(null);
    }
  }

  return { userPlan, pendingTier, handleCtaClick, planChangeModal, setPlanChangeModal, router };
}
