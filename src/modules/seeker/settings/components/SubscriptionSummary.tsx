"use client";

import { CalendarClock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PLAN_TIERS } from "@/constants/pricing";
import { SubscriptionStatus } from "@/constants/enums";
import type { SubscriptionStatusData } from "@/services/billing.service";

/*
 * SubscriptionSummary
 * Shows the user's current subscription status: plan name, renewal/expiry date,
 * and a status badge. Only rendered when a subscription record exists.
 */
export function SubscriptionSummary({
  sub,
  plan,
  onManage,
  managing,
}: {
  sub: SubscriptionStatusData["subscription"];
  plan?: string;
  onManage: () => void;
  managing: boolean;
}) {
  if (!sub) return null;

  const config = PLAN_TIERS.find((t) => t.id === String(plan).toLowerCase());
  const planLabel = config?.name ?? "Paid";
  const price = config?.monthlyPrice ?? null;
  const periodEnd = format(new Date(sub.currentPeriodEnd), "MMMM d, yyyy");
  const scheduled = sub.scheduledPlan
    ? PLAN_TIERS.find((t) => t.id === sub.scheduledPlan!.toLowerCase())?.name ?? sub.scheduledPlan
    : null;

  let badgeLabel = "Active";
  let badgeClass = "border border-brand-success/30 bg-brand-success/10 text-brand-success";
  let dateLine = `Renews on ${periodEnd}`;
  let note: string | null = null;
  let showManage = false;

  switch (sub.status) {
    case SubscriptionStatus.PAST_DUE:
      badgeLabel = "Payment failed";
      badgeClass = "border border-brand-danger/30 bg-brand-danger/10 text-brand-danger";
      dateLine = `Billing due ${periodEnd}`;
      note = `Update your payment method to keep ${planLabel} active.`;
      showManage = true;
      break;
    case SubscriptionStatus.CANCELED:
      badgeLabel = "Expired";
      badgeClass = "border border-brand-danger/30 bg-brand-danger/10 text-brand-danger";
      dateLine = `Ended on ${periodEnd}`;
      break;
    case SubscriptionStatus.ACTIVE:
    default:
      if (sub.cancelAtPeriodEnd) {
        badgeLabel = "Ending";
        badgeClass = "border border-brand-warning/30 bg-brand-warning/10 text-brand-warning";
        dateLine = `Expires on ${periodEnd}`;
        note = "Auto-renew is off. Your plan ends after this date.";
      }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-brand-border bg-white p-5">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
        <CreditCard className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-brand-foreground">{planLabel} plan</p>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-pill ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="text-sm text-brand-foreground-muted mt-1 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 shrink-0" />
          {dateLine}
        </p>
        {scheduled && (
          <p className="text-xs text-brand-foreground-muted mt-0.5">
            Switching to {scheduled} on {format(new Date(sub.scheduledChangeAt ?? sub.currentPeriodEnd), "MMMM d, yyyy")}
          </p>
        )}
        {note && (
          <p className="text-xs text-brand-foreground-muted mt-0.5">{note}</p>
        )}
        {showManage && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={onManage}
            loading={managing}
          >
            Manage Subscription
          </Button>
        )}
      </div>
      {price !== null && (
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-brand-foreground">
            ${price}
            <span className="text-sm font-normal text-brand-foreground-muted">/mo</span>
          </p>
        </div>
      )}
    </div>
  );
}
