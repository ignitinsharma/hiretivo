"use client";

import { ArrowUpRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BillingPeriod, CurrencyCode, PlanTier, PricingTierId } from "@/constants/enums";
import { billingService } from "@/services/billing.service";

interface RecruiterBillingSectionProps {
  plan: PlanTier;
  billingCustomerId: string | null;
}

export function RecruiterBillingSection({
  plan,
  billingCustomerId,
}: RecruiterBillingSectionProps) {
  const checkoutMutation = useMutation({
    mutationFn: () =>
      billingService.createCheckoutSession({
        planId: PricingTierId.PRO,
        period: BillingPeriod.MONTHLY,
        currency: CurrencyCode.USD,
      }),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#868685]">
        Current plan
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-[#0e0f0c] [font-feature-settings:'calt']">
            {plan}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#454745]">
            {billingCustomerId ? "Billing customer connected" : "Upgrade to unlock paid recruiter workflows"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => checkoutMutation.mutate()}
          disabled={checkoutMutation.isPending}
          className="rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
        >
          {checkoutMutation.isPending ? "Loading..." : "Upgrade plan"}
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <p className="sr-only">/api/billing/checkout</p>
    </section>
  );
}
