"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, Check, Clock, CreditCard, Crown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanTier } from "@/constants/enums";
import { cn } from "@/lib/utils";
import { billingService } from "@/services/billing.service";
import type { SubscriptionStatusData } from "@/services/billing.service";

type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

const PLAN_LABEL = { STARTER: "Starter", GROWTH: "Growth", SCALE: "Scale" } as const;

const FREE_FEATURES = [
  "1 active job post",
  "20 applicant views/mo",
  "Basic AI skill match",
];

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: "border-brand-border bg-gray-100 text-black",
  PAST_DUE: "border-amber-200 bg-amber-50 text-amber-700",
  CANCELED: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Past Due",
  CANCELED: "Canceled",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BillingSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function FreePlanCard() {
  const router = useRouter();

  return (
    <Card className="max-w-2xl border-brand-border bg-white">
      <CardHeader>
        <CardTitle className="text-xl">You&apos;re on the Free plan</CardTitle>
        <CardDescription>
          Start with matching basics, then upgrade when your hiring volume grows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {FREE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 text-black" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
          onClick={() => router.push("/pricing")}
        >
          Upgrade to PRO
        </Button>
      </CardContent>
    </Card>
  );
}

function PaidPlanCard({
  plan,
  subscription,
}: {
  plan: PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE;
  subscription: SubscriptionStatusData["subscription"];
}) {
  const router = useRouter();
  const portalMutation = useMutation({
    mutationFn: billingService.createPortalSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const status = subscription?.status ?? "ACTIVE";
  const periodEnd = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : null;
  const cancelsAtPeriodEnd = subscription?.cancelAtPeriodEnd === true;
  const planLabel =
    plan === PlanTier.SCALE ? "Scale"
    : plan === PlanTier.GROWTH ? "Growth"
    : "Starter";

  return (
    <Card className="max-w-2xl border-brand-primary/30 border-brand-border bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-black" aria-hidden />
            {planLabel} plan
          </CardTitle>
          <Badge variant="default" className={STATUS_STYLES[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <CardDescription>
          Your recruiter workspace has {planLabel} hiring tools enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {periodEnd && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden />
            {cancelsAtPeriodEnd ? `Expires on ${periodEnd}` : `Renews on ${periodEnd}`}
          </div>
        )}

        {cancelsAtPeriodEnd && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Your plan will not renew.
          </div>
        )}

        {subscription?.scheduledPlan && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">
                Downgrade to{" "}
                {PLAN_LABEL[subscription.scheduledPlan as keyof typeof PLAN_LABEL] ??
                  subscription.scheduledPlan}{" "}
                scheduled
                {subscription.scheduledChangeAt
                  ? ` for ${format(new Date(subscription.scheduledChangeAt), "MMM d, yyyy")}`
                  : ""}
              </p>
              <p className="mt-0.5 text-amber-700">
                Your current plan stays active until then.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary-dark"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
          >
            {portalMutation.isPending ? "Opening..." : "Manage billing"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/pricing")}
          >
            Change plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingTabContent() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: billingService.getSubscriptionStatus,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <BillingSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">Billing details could not be loaded.</p>
        <Button
          variant="default"
          size="sm"
          className="mt-3"
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Billing</h2>
        <p className="mt-1 text-sm text-gray-500">
          Plan, renewal, and payment management.
        </p>
      </div>

      {data.plan === PlanTier.FREE && <FreePlanCard />}
      {data.plan === PlanTier.STARTER && (
        <PaidPlanCard plan={PlanTier.STARTER} subscription={data.subscription} />
      )}
      {data.plan === PlanTier.GROWTH && (
        <PaidPlanCard plan={PlanTier.GROWTH} subscription={data.subscription} />
      )}
      {data.plan === PlanTier.SCALE && (
        <PaidPlanCard plan={PlanTier.SCALE} subscription={data.subscription} />
      )}
    </div>
  );
}
