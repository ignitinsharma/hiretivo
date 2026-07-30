"use client";

import { useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { PLAN_TIERS, type PlanTierConfig } from "@/constants/pricing";
import { BillingPeriod, PricingTierId } from "@/constants/enums";
import { toast } from "sonner";

const TD_BASE = "py-6 px-4 text-sm";
const CELL_LABEL = cn(TD_BASE, "font-semibold text-brand-foreground");
const CELL_BODY = cn(TD_BASE, "text-brand-foreground-muted");
const CELL_HIGHLIGHTED = cn(TD_BASE, "font-semibold text-brand-foreground bg-brand-primary/5");

interface FeatureRow {
  feature: string;
  free: string | boolean | null;
  pro: string | boolean | null;
  unlimited: string | boolean | null;
}

const FEATURE_ROWS: FeatureRow[] = [
  { feature: "Monthly generations", free: "2", pro: "20", unlimited: "Unlimited" },
  { feature: "AI resume tailoring", free: true, pro: true, unlimited: true },
  { feature: "Cover letter generation", free: true, pro: true, unlimited: true },
  { feature: "Editable resume preview", free: true, pro: true, unlimited: true },
  { feature: "PDF download", free: true, pro: true, unlimited: true },
  { feature: "PDF with edits", free: true, pro: true, unlimited: true },
  { feature: "Application tracking", free: "Basic", pro: "Full", unlimited: "Full" },
  { feature: "Priority AI processing", free: true, pro: true, unlimited: true },
  { feature: "Early access", free: null, pro: true, unlimited: true },
];

const FAQ_ITEMS = [
  {
    question: "What counts as a generation?",
    answer:
      "Each AI-tailored resume counts as one generation. Editing or downloading the same resume does not use additional credits.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade or downgrade at any time. Changes apply to the next billing cycle.",
  },
  {
    question: "Do unused generations roll over?",
    answer:
      "No. Monthly generation limits reset at the start of each billing period.",
  },
  {
    question: "Is my data used for training?",
    answer:
      "No. Your resumes, job data, and personal information are never used to train AI models. You can delete your account at any time.",
  },
];

function FeatureCell({ value, isHighlighted = false }: { value: string | boolean | null; isHighlighted?: boolean }) {
  if (value === null) return <td className={isHighlighted ? CELL_HIGHLIGHTED : cn(TD_BASE, "text-brand-foreground-secondary")}>—</td>;
  if (value === true) return <td className={isHighlighted ? CELL_HIGHLIGHTED : cn(TD_BASE, "font-semibold text-brand-foreground")}>✓</td>;
  return <td className={isHighlighted ? CELL_HIGHLIGHTED : CELL_BODY}>{value}</td>;
}

function PricingCard({
  tier,
  period,
  checkingOutId,
  onCheckout,
}: {
  tier: PlanTierConfig;
  period: BillingPeriod;
  checkingOutId: PricingTierId | null;
  onCheckout: (planId: PricingTierId) => void;
}) {
  const isHighlighted = tier.highlighted;
  const isPaid = tier.id !== PricingTierId.FREE;
  const isCheckingOut = checkingOutId === tier.id;

  const displayPrice =
    isPaid && period === BillingPeriod.ANNUAL && tier.monthlyPrice !== null
      ? Math.round((tier.annualTotal ?? 0) / 12)
      : tier.monthlyPrice;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border-2 border-black p-6 text-left h-full shadow-[4px_4px_0px_0px_#000]",
        isHighlighted
          ? "bg-brand-primary text-white"
          : "bg-white",
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-black bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-foreground shadow-[2px_2px_0px_0px_#000]">
          Most Popular
        </div>
      )}

      <div className={cn("mb-6 text-center", isHighlighted && "relative")}>
        <h3 className={cn("mb-2 text-[10px] font-bold uppercase tracking-wider", isHighlighted ? "text-white/90" : "text-brand-foreground-muted")}>
          {tier.name}
        </h3>

        <div className="flex items-baseline justify-center gap-1">
          <span className={cn("text-4xl font-bold", isHighlighted ? "text-white" : "text-brand-foreground")}>
            {displayPrice === null ? "" : `$${displayPrice}`}
          </span>
          {isPaid && (
            <span className={cn("text-sm", isHighlighted ? "text-white/90" : "text-brand-foreground-muted")}>/mo</span>
          )}
        </div>

        {isPaid && tier.annualTotal !== null && (
          <p className={cn("mt-1 text-xs", isHighlighted ? "text-white/80" : "text-brand-foreground-muted")}>
            {period === BillingPeriod.ANNUAL
              ? `$${tier.annualTotal}/yr — save $${tier.annualSavings}`
              : `$${tier.annualTotal}/yr — save $${tier.annualSavings}`}
          </p>
        )}
      </div>

      <ul className="mb-8 grow space-y-3 border-t border-black pt-4">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CircleCheck
              className={cn("mt-0.5 shrink-0 h-4 w-4", isHighlighted ? "text-white" : "text-brand-primary")}
              aria-hidden
            />
            <span className={cn("text-xs", isHighlighted ? "text-white/90" : "text-brand-foreground-muted")}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {isPaid ? (
        <Button
          variant={isHighlighted ? "secondary" : "primary"}
          size="lg"
          className="mt-auto w-full"
          onClick={() => onCheckout(tier.id as PricingTierId)}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking out...
            </>
          ) : (
            tier.cta
          )}
        </Button>
      ) : (
        <Button asChild variant="secondary" size="lg" className="mt-auto w-full">
          <Link href="/seeker/register">{tier.cta}</Link>
        </Button>
      )}
    </div>
  );
}

function PricingCompareTable() {
  return (
    <section className="border-t border-brand-border px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-16 text-center text-3xl font-bold text-brand-foreground">Compare features</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Feature</th>
              <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Free</th>
              <th className={cn(TD_BASE, "font-bold text-brand-foreground bg-brand-primary/5")}>Pro</th>
              <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Unlimited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {FEATURE_ROWS.map((row) => (
              <tr key={row.feature}>
                <td className={CELL_LABEL}>{row.feature}</td>
                <FeatureCell value={row.free} />
                <FeatureCell value={row.pro} isHighlighted />
                <FeatureCell value={row.unlimited} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PricingFaqSection() {
  return (
    <section className="bg-brand-surface px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-16 text-center text-3xl font-bold text-brand-foreground">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="overflow-hidden rounded-xl border border-brand-border bg-white"
            >
              <AccordionTrigger className="px-6 py-6 text-left text-lg font-bold text-brand-foreground hover:no-underline hover:text-brand-primary">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-base leading-relaxed text-brand-foreground-muted">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-16 text-center">
          <p className="text-brand-foreground-muted">
            Still have questions?{" "}
            <Link className="font-bold text-brand-foreground underline decoration-2 hover:text-brand-primary" href="/contact">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function PricingClient() {
  const [period, setPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);
  const [checkingOutId, setCheckingOutId] = useState<PricingTierId | null>(null);

  const handleCheckout = async (planId: PricingTierId) => {
    setCheckingOutId(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.data.url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <>
      <section className="px-6 pb-12 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-brand-foreground md:text-5xl">
            Land more interviews for less
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-brand-foreground-muted md:text-xl">
            Start free, upgrade when your search heats up. Every plan includes AI resume tailoring and cover letters.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex justify-center">
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(v) => v && setPeriod(v as BillingPeriod)}
            >
              <ToggleGroupItem value={BillingPeriod.MONTHLY}>Monthly</ToggleGroupItem>
              <ToggleGroupItem value={BillingPeriod.ANNUAL}>Annual</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLAN_TIERS.map((tier) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                period={period}
                checkingOutId={checkingOutId}
                onCheckout={handleCheckout}
              />
            ))}
          </div>
        </div>
      </section>

      <PricingCompareTable />
      <PricingFaqSection />
    </>
  );
}
