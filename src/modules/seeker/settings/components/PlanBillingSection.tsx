"use client";

import { useState } from "react";
import { CircleCheck, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_TIERS, type PlanTierConfig } from "@/constants/pricing";
import { PricingTierId } from "@/constants/enums";
import { billingService, type SubscriptionStatusData } from "@/services/billing.service";

/*
 * PlanBillingSection
 * Shows the Free/Pro/Unlimited pricing tiers with the user's current plan highlighted.
 * Upgrade CTAs redirect to the billing checkout flow.
 */
export function PlanBillingSection() {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: subData, isLoading, isError } = useQuery<SubscriptionStatusData>({
    queryKey: ["billing-subscription-status"],
    queryFn: billingService.getSubscriptionStatus,
    staleTime: 60_000,
  });

  const currentPlan = subData?.plan;

  const handleUpgrade = async (tier: PlanTierConfig) => {
    if (tier.id === PricingTierId.FREE || String(currentPlan) === String(tier.id)) return;
    setLoadingPlanId(tier.id);
    try {
      const url = await billingService.createCheckoutSession({ planId: tier.id } as Parameters<typeof billingService.createCheckoutSession>[0]);
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Could not start checkout. Try again.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleManage = async () => {
    setLoadingPlanId("manage");
    try {
      const url = await billingService.createPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Could not open billing portal. Try again.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const isCurrentPlan = (id: string): boolean => String(currentPlan) === id;
  const hasPaidPlan = currentPlan && String(currentPlan) !== PricingTierId.FREE;

  return (
    <section className="rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">Plan &amp; Billing</h3>
        <p className="text-sm text-brand-foreground-muted">
          Choose the plan that fits your job search needs.
        </p>
      </div>

      {isLoading ? (
        <div className="p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError ? (
        <div className="p-6">
          <p className="text-sm text-red-500">Failed to load plan details. Try again.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {PLAN_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5",
                  tier.highlighted
                    ? "border-brand-primary bg-brand-primary text-white"
                    : isCurrentPlan(tier.id)
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-brand-border bg-white",
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-brand-primary bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground">
                    Most Popular
                  </div>
                )}

                <h4 className={cn(
                  "text-lg font-bold",
                  tier.highlighted ? "text-white" : "text-brand-foreground",
                )}>
                  {tier.name}
                </h4>

                <div className="mt-3 mb-4">
                  {tier.monthlyPrice === null ? (
                    <span className={cn("text-3xl font-bold", tier.highlighted ? "text-white" : "text-brand-foreground")}>
                      Free
                    </span>
                  ) : (
                    <>
                      <span className={cn("text-3xl font-bold", tier.highlighted ? "text-white" : "text-brand-foreground")}>
                        ${tier.monthlyPrice}
                      </span>
                      <span className={cn("text-sm", tier.highlighted ? "text-white/80" : "text-brand-foreground-muted")}>
                        /mo
                      </span>
                    </>
                  )}
                  {tier.annualSavings && tier.annualSavings > 0 && (
                    <p className={cn("text-xs mt-1", tier.highlighted ? "text-white/80" : "text-brand-foreground-muted")}>
                      ${tier.annualTotal}/yr — save ${tier.annualSavings}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CircleCheck className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        tier.highlighted ? "text-white" : "text-brand-primary",
                      )} />
                      <span className={tier.highlighted ? "text-white/90" : "text-brand-foreground-muted"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan(tier.id) ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : tier.id === PricingTierId.FREE ? (
                  <Button variant="secondary" className="w-full" disabled>
                    {tier.cta}
                  </Button>
                ) : (
                  <Button
                    variant={tier.highlighted ? "secondary" : "primary"}
                    className="w-full"
                    onClick={() => handleUpgrade(tier)}
                    loading={loadingPlanId === tier.id}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {hasPaidPlan && (
            <div className="border-t border-brand-border px-6 py-4">
              <Button variant="secondary" onClick={handleManage} loading={loadingPlanId === "manage"}>
                Manage Subscription
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
