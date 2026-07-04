"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlanTier, PricingTierId } from "@/constants/enums";
import { PLAN_TIERS } from "@/constants/pricing";
import { PLAN_DISPLAY_NAMES } from "@/lib/billing/ai-daily-limit";
import { useCredits } from "@/hooks/use-credits";
import { usePlanCheckout } from "@/hooks/use-plan-checkout";
import { PlanChangeModal } from "@/components/shared/PlanChangeModal";

/*
 * PlansSection
 * Settings "Plans" tab (Phase 8) — current plan, credits used/remaining bar,
 * and a monthly/annual toggle over the same Free/Pro/Max tier cards as the
 * public pricing page, wired through the shared usePlanCheckout hook so
 * upgrade/downgrade/portal logic isn't duplicated here.
 */
export function PlansSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: creditsData } = useCredits();
  const { userPlan, pendingTier, handleCtaClick, planChangeModal, setPlanChangeModal } =
    usePlanCheckout("/settings");

  const plan = userPlan ?? PlanTier.FREE;
  const planLabel = PLAN_DISPLAY_NAMES[plan];
  const remaining = creditsData?.data.remaining ?? 0;
  const limit = creditsData?.data.limit ?? 0;
  const usedPct = limit > 0 ? Math.max(0, Math.min(100, Math.round(((limit - remaining) / limit) * 100))) : 0;

  return (
    <section id="plans" className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">Plans &amp; credits</h3>
        <p className="text-sm text-brand-foreground-muted">
          Your current plan, monthly AI credits, and upgrade options.
        </p>
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-foreground">{planLabel} plan</span>
            <span className="text-sm text-brand-foreground-muted">
              {remaining}/{limit} credits left this month
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-lg bg-brand-border">
            <div className="h-full rounded-lg bg-brand-primary" style={{ width: `${usedPct}%` }} aria-hidden />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            aria-pressed={!isAnnual}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              !isAnnual ? "bg-brand-primary text-white" : "bg-brand-surface text-brand-foreground-muted",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            aria-pressed={isAnnual}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              isAnnual ? "bg-brand-primary text-white" : "bg-brand-surface text-brand-foreground-muted",
            )}
          >
            Annual · 2 months free
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLAN_TIERS.map((tier) => {
            const isCurrent =
              (plan === PlanTier.STARTER && tier.id === PricingTierId.STARTER) ||
              (plan === PlanTier.GROWTH && tier.id === PricingTierId.GROWTH) ||
              (plan === PlanTier.SCALE && tier.id === PricingTierId.GROWTH) ||
              (plan === PlanTier.FREE && tier.id === PricingTierId.FREE);
            const price = isAnnual ? tier.annualTotal : tier.monthlyPrice;

            return (
              <div
                key={tier.id}
                className={cn(
                  "rounded-xl border p-4",
                  isCurrent ? "border-brand-primary bg-brand-primary/5" : "border-brand-border",
                )}
              >
                <p className="text-sm font-bold text-brand-foreground">{tier.name}</p>
                <p className="mt-1 text-2xl font-bold text-brand-foreground">
                  ${price}
                  <span className="text-xs font-normal text-brand-foreground-muted">
                    {tier.id === PricingTierId.FREE ? "" : isAnnual ? "/yr" : "/mo"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-brand-foreground-muted">
                  {tier.monthlyCredits} credits/mo
                </p>
                <Button
                  variant={isCurrent ? "secondary" : "primary"}
                  size="sm"
                  className="mt-4 w-full"
                  disabled={pendingTier === tier.id}
                  onClick={() => handleCtaClick(tier.id, isAnnual)}
                >
                  {isCurrent ? "Manage billing" : tier.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {planChangeModal && (
        <PlanChangeModal
          open={planChangeModal.open}
          onOpenChange={(open) => setPlanChangeModal(planChangeModal ? { ...planChangeModal, open } : null)}
          mode={planChangeModal.mode}
          targetPlan={planChangeModal.targetPlan}
          targetPlanId={planChangeModal.targetPlanId}
          period={planChangeModal.period}
          onSuccess={() => setPlanChangeModal(null)}
        />
      )}
    </section>
  );
}
