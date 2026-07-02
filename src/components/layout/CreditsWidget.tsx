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
 * Bottom-of-sidebar widget: AI-credits-left progress + Upgrade CTA.
 * @param creditsLeft  - credits remaining this cycle (STATIC in Phase 1b)
 * @param creditsTotal - credits granted this cycle
 * @param planLabel    - human plan name (e.g. "Free")
 * @param collapsed    - icon-only sidebar mode
 * Phase 8 will replace the static props with a live subscription query.
 */
export function CreditsWidget({
  creditsLeft,
  creditsTotal,
  planLabel,
  collapsed,
}: CreditsWidgetProps) {
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
          className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors"
        >
          <Zap className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-brand-foreground-muted">
            {planLabel} plan
          </span>
          <span className="text-xs font-semibold text-brand-foreground">
            {creditsLeft}/{creditsTotal}
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-lg bg-brand-border">
          <div
            className="h-full rounded-lg bg-brand-primary"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        <Button variant="primary" className="w-full py-2 text-sm" asChild>
          <Link href="/pricing">
            <Zap className="w-4 h-4 shrink-0" />
            Upgrade
          </Link>
        </Button>
      </div>
    </div>
  );
}
