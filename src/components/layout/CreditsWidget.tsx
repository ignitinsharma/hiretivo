"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CreditsWidgetProps {
  creditsLeft: number;
  creditsTotal: number;
  planLabel: string;
  collapsed: boolean;
}

/*
 * CreditsWidget
 * Bottom-of-sidebar widget: live AI-credits-left progress + Upgrade CTA,
 * sourced from GET /api/seeker/credits via useCreditStatus (SidebarCreditsSlot).
 * @param creditsLeft  - credits remaining this cycle
 * @param creditsTotal - credits granted this cycle
 * @param planLabel    - human plan name (e.g. "Free")
 * @param collapsed    - icon-only sidebar mode
 * Zero remaining renders in the same danger treatment CreditsBanner uses, so
 * the two never disagree on how urgent "out of credits" looks.
 */
export function CreditsWidget({
  creditsLeft,
  creditsTotal,
  planLabel,
  collapsed,
}: CreditsWidgetProps) {
  const isExhausted = creditsLeft <= 0;
  const pct =
    creditsTotal > 0
      ? Math.max(0, Math.min(100, Math.round((creditsLeft / creditsTotal) * 100)))
      : 0;

  if (collapsed) {
    return (
      <div className="px-2 pb-3">
        <Link
          href="/pricing"
          aria-label="Upgrade plan"
          className={cn(
            "flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition-colors",
            isExhausted
              ? "bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20"
              : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
          )}
        >
          <Zap className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div
        className={cn(
          "rounded-xl border p-3",
          isExhausted ? "border-brand-danger/30 bg-brand-danger/5" : "border-brand-border bg-brand-surface",
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-brand-foreground-muted">
            {planLabel} plan
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              isExhausted ? "text-brand-danger" : "text-brand-foreground",
            )}
          >
            {creditsLeft}/{creditsTotal}
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-lg bg-brand-border">
          <div
            className={cn("h-full rounded-lg", isExhausted ? "bg-brand-danger" : "bg-brand-primary")}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        <Button variant="primary" className="w-full py-2 text-sm" asChild>
          <Link href="/pricing">
            <Zap className="w-4 h-4 shrink-0" />
            {isExhausted ? "Upgrade now" : "Upgrade"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/*
 * CreditsWidgetSkeleton
 * Pulse placeholder matching CreditsWidget's exact footprint (both sidebar
 * states) so the sidebar doesn't jump when live credit data arrives.
 */
export function CreditsWidgetSkeleton({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="px-2 pb-3">
        <div className="h-9 w-9 mx-auto animate-pulse rounded-lg bg-brand-border" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-3 w-14 animate-pulse rounded bg-brand-border" />
          <div className="h-3 w-10 animate-pulse rounded bg-brand-border" />
        </div>
        <div className="mb-3 h-1.5 w-full animate-pulse rounded-lg bg-brand-border" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-brand-border" />
      </div>
    </div>
  );
}
