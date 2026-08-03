"use client";

import { useState } from "react";
import { CircleCheck, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLAN_TIERS, type PlanTierConfig } from "@/constants/pricing";
import { BillingPeriod, CurrencyCode, PricingTierId } from "@/constants/enums";
import { billingService, type SubscriptionStatusData } from "@/services/billing.service";
import { SubscriptionSummary } from "./SubscriptionSummary";

/*
 * PlanBillingSection
 * Shows the Free/Pro/Unlimited pricing tiers with the user's current plan highlighted,
 * a Monthly/Annual billing period toggle, and checkout CTAs that respect the selected period.
 * Upgrade CTAs redirect to the billing checkout flow.
 */
export function PlanBillingSection() {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);

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
      const url = await billingService.createCheckoutSession({ planId: tier.id, period, currency: CurrencyCode.USD });
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

  const isCurrentPlan = (id: string): boolean => String(currentPlan).toLowerCase() === id;

  const getDisplayPrice = (tier: PlanTierConfig): number | null =>
    tier.monthlyPrice !== null && period === BillingPeriod.ANNUAL
      ? Math.round((tier.annualTotal ?? 0) / 12)
      : tier.monthlyPrice;

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
          <div className="px-6 pt-6">
            <SubscriptionSummary
              sub={subData?.subscription ?? null}
              plan={subData?.plan}
              onManage={handleManage}
              managing={loadingPlanId === "manage"}
            />
          </div>

          <div className="flex justify-center px-6 pt-6">
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(v) => v && setPeriod(v as BillingPeriod)}
            >
              <ToggleGroupItem value={BillingPeriod.MONTHLY}>Monthly</ToggleGroupItem>
              <ToggleGroupItem value={BillingPeriod.ANNUAL}>Annual</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {PLAN_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "relative flex flex-col rounded-2xl p-5",
                  tier.highlighted
                    ? "border-2 border-black bg-brand-primary text-white shadow-[4px_4px_0px_0px_#000]"
                    : isCurrentPlan(tier.id)
                      ? "border border-brand-primary bg-brand-primary/5"
                      : "border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]",
                )}
              >
                {(isCurrentPlan(tier.id) || tier.highlighted) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-black bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground shadow-[2px_2px_0px_0px_#000]">
                    {isCurrentPlan(tier.id) ? "Current Plan" : "Most Popular"}
                  </div>
                )}

                <h4 className={cn(
                  "text-lg font-bold",
                  tier.highlighted ? "text-white" : "text-brand-foreground",
                )}>
                  {tier.name}
                </h4>

                <div className="mt-3 mb-4 text-center">
                  {tier.monthlyPrice === null ? (
                    <span className={cn("text-3xl font-bold", tier.highlighted ? "text-white" : "text-brand-foreground")}>
                      Free
                    </span>
                  ) : (
                    <>
                      <span className={cn("text-3xl font-bold", tier.highlighted ? "text-white" : "text-brand-foreground")}>
                        ${getDisplayPrice(tier)}
                      </span>
                      <span className={cn("text-sm", tier.highlighted ? "text-white/90" : "text-brand-foreground-muted")}>
                        /mo
                      </span>
                    </>
                  )}
                  {tier.annualSavings !== null && tier.annualSavings > 0 && (
                    <p className={cn("text-xs mt-1", tier.highlighted ? "text-white/90" : "text-brand-foreground-muted")}>
                      ${tier.annualTotal}/yr — save ${tier.annualSavings}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1 border-t border-black pt-4">
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
                  tier.id === PricingTierId.FREE ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleManage}
                      loading={loadingPlanId === "manage"}
                    >
                      Manage Subscription
                    </Button>
                  )
                ) : tier.id === PricingTierId.FREE ? (
                  <Button variant="secondary" className="w-full" disabled>
                    {tier.cta}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
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
        </>
      )}
    </section>
  );
}
