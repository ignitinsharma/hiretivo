"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Clock, CreditCard } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PlanTier, SubscriptionStatus } from "@/constants/enums";
import { billingService } from "@/services/billing.service";

interface RecruiterBillingSectionProps {
  plan: PlanTier;
  billingCustomerId: string | null;
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: "Active",
  [SubscriptionStatus.PAST_DUE]: "Past due",
  [SubscriptionStatus.CANCELED]: "Canceled",
};

function formatBillingDate(value: string): string {
  return format(new Date(value), "MMM d, yyyy");
}

export function RecruiterBillingSection({
  plan,
  billingCustomerId,
}: RecruiterBillingSectionProps) {
  const { data } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: billingService.getSubscriptionStatus,
    staleTime: 60_000,
  });

  const portalMutation = useMutation({
    mutationFn: billingService.createPortalSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const currentPlan = data?.plan ?? plan;
  const subscription = data?.subscription ?? null;
  const hasBillingAccount = Boolean(billingCustomerId);
  const renewalLabel =
    subscription?.currentPeriodEnd && currentPlan !== PlanTier.FREE
      ? `${subscription.cancelAtPeriodEnd ? "Expires" : "Renews"} on ${formatBillingDate(
          subscription.currentPeriodEnd,
        )}`
      : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-foreground-muted">
        Current plan
      </p>
      <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold leading-snug tracking-tight text-brand-foreground">
            {currentPlan === PlanTier.STARTER ? "Starter"
            : currentPlan === PlanTier.GROWTH ? "Growth"
            : currentPlan === PlanTier.SCALE ? "Scale"
            : "Free"}
          </h3>
          <p className="mt-1 text-sm font-medium text-brand-foreground-muted">
            {currentPlan === PlanTier.FREE
              ? "Free recruiter tools are active."
              : hasBillingAccount
                ? "Billing customer connected."
                : "Billing is managed by your account team."}
          </p>
          {subscription && (
            <p className="mt-3 inline-flex items-center rounded-lg border border-brand-border bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-foreground">
              Billing status: {STATUS_LABELS[subscription.status]}
            </p>
          )}
          {renewalLabel && (
            <p className="mt-3 flex items-center gap-2 text-sm text-brand-foreground-muted">
              <Clock className="h-4 w-4" aria-hidden />
              {renewalLabel}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          {currentPlan === PlanTier.FREE && (
            <Button asChild variant="primary">
              <Link href="/pricing">
                View pricing
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          )}

          {(currentPlan === PlanTier.STARTER ||
            currentPlan === PlanTier.GROWTH ||
            currentPlan === PlanTier.SCALE) && (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => portalMutation.mutate()}
                loading={portalMutation.isPending}
                loadingText="Opening..."
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                Manage billing
              </Button>
              <Button asChild variant="secondary">
                <Link href="/pricing">Explore higher plans</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
