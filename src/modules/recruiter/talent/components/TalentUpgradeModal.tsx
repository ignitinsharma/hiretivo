"use client";

import React from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TierConfig {
  name: string;
  price: number;
  unlocks: string;
  plan: "starter" | "growth" | "scale";
  highlighted: boolean;
}

const UPGRADE_TIERS: TierConfig[] = [
  { name: "Starter", price: 199, unlocks: "10 unlocks/mo", plan: "starter", highlighted: true },
  { name: "Growth",  price: 399, unlocks: "30 unlocks/mo", plan: "growth",  highlighted: false },
  { name: "Scale",   price: 799, unlocks: "Unlimited",     plan: "scale",   highlighted: false },
];

interface TalentUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engineerTeaser?: string;
}

/*
 * TalentUpgradeModal
 * Inline upgrade modal shown when FREE-plan recruiters attempt to unlock engineers.
 * Calls /api/billing/checkout directly and redirects to Dodo payment page.
 * @param open - Dialog open state
 * @param onOpenChange - Dialog close handler
 * @param engineerTeaser - Optional teaser text to personalize modal
 */
export function TalentUpgradeModal({
  open,
  onOpenChange,
  engineerTeaser,
}: TalentUpgradeModalProps): ReactElement {
  const [loadingTier, setLoadingTier] = React.useState<string | null>(null);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  async function handleUpgrade(plan: "starter" | "growth" | "scale") {
    setLoadingTier(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, period: "monthly", currency: "USD" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCheckoutError(json.error ?? "Checkout failed. Try again.");
        return;
      }
      window.location.href = json.data.url;
    } catch {
      setCheckoutError("Network error. Try again.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border border-brand-border bg-white p-6 sm:max-w-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-brand-foreground">
            Unlock India&apos;s Verified Engineers
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-brand-foreground-muted">
            {engineerTeaser
              ? `Upgrade to reveal full profile for ${engineerTeaser} and access the entire talent pool.`
              : "Upgrade to access the full talent pool — search, unlock, and contact verified engineers directly."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {UPGRADE_TIERS.map((tier) => (
            <div
              key={tier.plan}
              className={`rounded-xl border p-4 ${
                tier.highlighted
                  ? "border-brand-primary bg-brand-surface"
                  : "border-brand-border bg-white"
              }`}
            >
              <div className="mb-1 text-sm font-bold text-brand-foreground">{tier.name}</div>
              <div className="mb-0.5 text-2xl font-bold tracking-tight text-brand-foreground">
                ${tier.price}
                <span className="text-sm font-medium text-brand-foreground-muted">/mo</span>
              </div>
              <div className="mb-4 text-xs font-semibold text-brand-foreground-muted">
                {tier.unlocks}
              </div>
              <Button
                variant={tier.highlighted ? "primary" : "secondary"}
                className="w-full"
                size="sm"
                disabled={loadingTier !== null}
                onClick={() => handleUpgrade(tier.plan)}
              >
                {loadingTier === tier.plan ? "Redirecting…" : `Get ${tier.name}`}
              </Button>
            </div>
          ))}
        </div>

        {checkoutError && (
          <p className="mt-2 text-xs text-brand-danger">{checkoutError}</p>
        )}

        <div className="mt-4 text-center">
          <a
            href="/pricing"
            className="text-sm font-medium text-brand-foreground-muted underline-offset-2 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            See all plans →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
