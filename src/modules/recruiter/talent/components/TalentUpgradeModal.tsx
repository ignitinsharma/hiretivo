"use client";

import Link from "next/link";
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
  plan: "STARTER" | "GROWTH" | "SCALE";
  highlighted: boolean;
}

const UPGRADE_TIERS: TierConfig[] = [
  {
    name: "Starter",
    price: 199,
    unlocks: "10 unlocks/mo",
    plan: "STARTER",
    highlighted: true,
  },
  {
    name: "Growth",
    price: 399,
    unlocks: "30 unlocks/mo",
    plan: "GROWTH",
    highlighted: false,
  },
  {
    name: "Scale",
    price: 799,
    unlocks: "Unlimited",
    plan: "SCALE",
    highlighted: false,
  },
];

interface TalentUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional teaser line shown above tiers, e.g. "Priya S. • 88/100 • React, Node.js" */
  engineerTeaser?: string;
}

/*
 * TalentUpgradeModal
 * Inline upgrade modal (shadcn Dialog) shown when FREE-plan recruiters attempt to:
 *   - Unlock a demo engineer card (Unlock Now button)
 *   - Unlock a real blurred engineer card
 *   - Click the disabled search bar
 * Shows 3 pricing tiers (Starter/Growth/Scale) with CTAs that route to /pricing.
 * Direct checkout links deferred until STARTER/GROWTH/SCALE billing tiers exist in the API.
 * Secondary "See all plans →" link also navigates to /pricing.
 * @param open - Dialog open state
 * @param onOpenChange - Dialog close handler
 * @param engineerTeaser - Optional teaser text (name + score + skills) to personalize modal
 */
export function TalentUpgradeModal({
  open,
  onOpenChange,
  engineerTeaser,
}: TalentUpgradeModalProps): ReactElement {
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

        {/* Pricing tiers side-by-side */}
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
              <div className="mb-1 text-sm font-bold text-brand-foreground">
                {tier.name}
              </div>
              <div className="mb-0.5 text-2xl font-bold tracking-tight text-brand-foreground">
                ${tier.price}
                <span className="text-sm font-medium text-brand-foreground-muted">/mo</span>
              </div>
              <div className="mb-4 text-xs font-semibold text-brand-foreground-muted">
                {tier.unlocks}
              </div>
              <Button
                asChild
                variant={tier.highlighted ? "primary" : "secondary"}
                className="w-full"
                size="sm"
              >
                <Link href="/pricing" onClick={() => onOpenChange(false)}>
                  Start with {tier.name}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Secondary CTA */}
        <div className="mt-4 text-center">
          <Link
            href="/pricing"
            className="text-sm font-medium text-brand-foreground-muted underline-offset-2 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            See all plans →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
