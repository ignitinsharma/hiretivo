"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  BillingPeriod,
  CurrencyCode,
  PlanTier,
  PricingTierId,
} from "@/constants/enums";
import { billingService } from "@/services/billing.service";

interface RecruiterBillingSectionProps {
  plan: PlanTier;
  billingCustomerId: string | null;
}

const PERIOD_OPTIONS: ReadonlyArray<{ value: BillingPeriod; label: string }> = [
  { value: BillingPeriod.MONTHLY, label: "Monthly" },
  { value: BillingPeriod.ANNUAL, label: "Annual" },
] as const;

export function RecruiterBillingSection({
  plan,
  billingCustomerId,
}: RecruiterBillingSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>(
    BillingPeriod.MONTHLY,
  );

  const checkoutMutation = useMutation({
    mutationFn: () =>
      billingService.createCheckoutSession({
        planId: PricingTierId.PRO,
        period: selectedPeriod,
        currency: CurrencyCode.USD,
      }),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#868685]">
        Current plan
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-foreground">
            {plan}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#454745]">
            {billingCustomerId
              ? "Billing customer connected"
              : "Upgrade to unlock paid recruiter workflows"}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex gap-2"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={selectedPeriod === opt.value ? "primary" : "secondary"}
                size="sm"
                aria-pressed={selectedPeriod === opt.value}
                onClick={() => setSelectedPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? "Loading..." : "Upgrade plan"}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="sr-only">/api/billing/checkout</p>
    </section>
  );
}
