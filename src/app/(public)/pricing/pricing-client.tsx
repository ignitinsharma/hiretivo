"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BillingPeriod,
  PricingTierId,
  UserRole,
  PlanTier,
} from "@/constants/enums";
import { useUIStore } from "@/store/use-ui-store";
import { PLAN_TIERS, type PlanTierConfig } from "@/constants/pricing";
import { isAllowedCheckoutReturnTo } from "@/lib/billing/checkout-return";
import { PlanChangeModal } from "@/components/shared/PlanChangeModal";

// ─── Table cell class constants ───────────────────────────────────────────────

const TD_BASE = "py-6 px-4 text-sm";
const CELL_LABEL = cn(TD_BASE, "font-semibold text-slate-700");
const CELL_MUTED = cn(TD_BASE, "text-slate-400");
const CELL_BODY = cn(TD_BASE, "text-slate-600");
const CELL_PRO = cn(TD_BASE, "font-bold text-black bg-gray-100/50");
const CELL_CHECK_GREEN = cn(TD_BASE, "text-black font-bold");
const CELL_PRO_CHECK = cn(TD_BASE, "font-bold text-black bg-gray-100/50");

// ─── Feature comparison data ──────────────────────────────────────────────────

type PlanValue = string | boolean | null;

interface FeatureRow {
  feature: string;
  free: PlanValue;
  starter: PlanValue;
  growth: PlanValue;
  scale: PlanValue;
}

const FEATURE_ROWS: FeatureRow[] = [
  { feature: "Engineer unlocks/mo", free: "—", starter: "10", growth: "30", scale: "Unlimited" },
  { feature: "Active job posts", free: "—", starter: "2", growth: "Unlimited", scale: "Unlimited" },
  { feature: "Full contact details", free: null, starter: true, growth: true, scale: true },
  { feature: "AI candidate summaries", free: true, starter: true, growth: true, scale: true },
  { feature: "Interview scheduling", free: true, starter: true, growth: true, scale: true },
  { feature: "Talent pool access", free: null, starter: true, growth: true, scale: true },
  { feature: "Priority support", free: null, starter: true, growth: true, scale: true },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade any time from the pricing page. If you need to downgrade, contact support and we will handle it within one billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Checkout is handled securely through our billing provider. Credit/debit cards and major payment methods are available at checkout.",
  },
  {
    question: "Do unused unlocks roll over?",
    answer:
      "No — unlock quotas reset each billing period. This keeps pricing fair for all plans.",
  },
  {
    question: "What happens to my listings if I downgrade?",
    answer:
      "Your existing listings remain, but Free plan limits apply immediately after downgrade. Existing unlocks are preserved.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FeatureCellProps {
  value: PlanValue;
  isHighlighted?: boolean;
}

function FeatureCell({ value, isHighlighted = false }: FeatureCellProps) {
  if (value === null) {
    return <td className={isHighlighted ? CELL_PRO : CELL_MUTED}>—</td>;
  }
  if (value === true) {
    return <td className={isHighlighted ? CELL_PRO_CHECK : CELL_CHECK_GREEN}>✓</td>;
  }
  return <td className={isHighlighted ? CELL_PRO : CELL_BODY}>{value}</td>;
}

interface PricingCardProps {
  tier: PlanTierConfig;
  isAnnual: boolean;
  userPlan?: PlanTier;
  onCtaClick: (tierId: string) => void;
  isPending?: boolean;
}

function PricingCardFeatureList({
  features,
  highlighted,
}: {
  features: string[];
  highlighted: boolean;
}) {
  return (
    <ul className="space-y-3 mb-8 grow">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CircleCheck
            className={cn(
              "mt-0.5 shrink-0",
              highlighted ? "fill-primary" : "fill-primary text-white",
            )}
            size={16}
            strokeWidth={2.5}
            aria-hidden
          />
          <span className={cn("text-xs", highlighted ? "text-gray-50" : "text-slate-700")}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

/*
 * PricingCard
 * Single tier card for the pricing page. Handles free, paid, and custom (enterprise) tiers.
 */
function PricingCard({
  tier,
  isAnnual,
  userPlan,
  onCtaClick,
  isPending = false,
}: PricingCardProps) {
  const isHighlighted = tier.highlighted === true;
  const isCustom = tier.isCustom === true;

  const isPaidPlan =
    userPlan === PlanTier.STARTER ||
    userPlan === PlanTier.GROWTH ||
    userPlan === PlanTier.SCALE;

  const isCurrentPlan =
    (userPlan === PlanTier.STARTER && tier.id === PricingTierId.STARTER) ||
    (userPlan === PlanTier.GROWTH && tier.id === PricingTierId.GROWTH) ||
    (userPlan === PlanTier.SCALE && tier.id === PricingTierId.SCALE) ||
    (isPaidPlan && isCustom && false);

  const displayedCtaText = isCurrentPlan ? "Manage billing" : tier.cta;

  const displayedPrice = (() => {
    if (tier.monthlyPrice === null) return null;
    if (isAnnual && tier.annualTotal !== null) return tier.annualTotal;
    return tier.monthlyPrice;
  })();

  const billingSuffix = isAnnual ? "/yr" : "/mo";
  const priceFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  return (
    <div
      className={cn(
        "p-6 rounded-xl flex flex-col h-full text-left relative",
        isHighlighted
          ? "bg-brand-primary border-2 border-brand-primary transform lg:scale-105 z-10 text-white"
          : "bg-white border border-gray-200",
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-extrabold px-4 py-1 rounded-full uppercase whitespace-nowrap">
          Most Popular
        </div>
      )}
      {isCurrentPlan && (
        <div
          className={cn(
            "absolute right-4 top-4 rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            isHighlighted
              ? "border-white/30 bg-white/10 text-white"
              : "border-brand-border bg-brand-surface text-brand-foreground",
          )}
        >
          Current plan
        </div>
      )}

      <div className="mb-6">
        <h3
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider mb-2",
            isHighlighted ? "text-gray-100" : "text-slate-900",
          )}
        >
          {tier.name}
        </h3>

        {isCustom ? (
          <>
            <div className="flex items-baseline gap-1 min-h-12">
              <span className="text-4xl font-bold text-slate-900">Custom</span>
            </div>
            <p className="mt-2 text-slate-400 text-[10px]">Pricing available after consultation</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-4xl font-bold", isHighlighted ? "text-white" : "text-slate-900")}>
                ${displayedPrice === null ? "" : priceFormatter.format(displayedPrice)}
              </span>
              {tier.id !== PricingTierId.FREE && (
                <span className={cn("text-sm ml-1", isHighlighted ? "text-gray-200" : "text-slate-500")}>
                  {billingSuffix}
                </span>
              )}
            </div>
            {tier.id === PricingTierId.FREE && (
              <p className="mt-2 text-slate-400 text-[10px]">Forever free</p>
            )}
          </>
        )}
      </div>

      {!isCustom && tier.id !== PricingTierId.FREE && (
        <div className={cn("p-2.5 rounded-lg mb-6 text-center", isHighlighted ? "bg-white/10" : "bg-gray-50")}>
          {isAnnual && tier.annualSavings !== null && tier.annualTotal !== null ? (
            <p className={cn("text-[10px] font-bold", isHighlighted ? "text-white" : "text-black")}>
              Save ${priceFormatter.format(tier.annualSavings)}/yr · ${priceFormatter.format(tier.annualTotal)} billed annually
            </p>
          ) : (
            <p className={cn("text-[10px] font-bold", isHighlighted ? "text-white" : "text-slate-600")}>
              Billed monthly
            </p>
          )}
        </div>
      )}

      {tier.id === PricingTierId.FREE && <div className="h-px bg-slate-100 mb-6" />}
      {isCustom && <div className="h-px bg-slate-100 mb-6" />}

      <PricingCardFeatureList features={tier.features} highlighted={isHighlighted} />

      {isCustom ? (
        <Link href="/contact" className="w-full mt-auto">
          <Button variant="default" size="lg" className="w-full">{tier.cta}</Button>
        </Link>
      ) : (
        <Button
          variant={isHighlighted ? "primary" : "secondary"}
          size="lg"
          className="w-full mt-auto"
          loading={isPending}
          loadingText={isCurrentPlan ? "Opening billing..." : "Opening checkout..."}
          onClick={() => onCtaClick(tier.id)}
        >
          {displayedCtaText}
        </Button>
      )}
    </div>
  );
}

function PricingCompareTable() {
  return (
    <section className="py-24 px-6 overflow-x-auto border-t border-slate-100">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Compare features</h2>
        <div className="min-w-[700px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className={cn(TD_BASE, "font-bold text-slate-500 uppercase tracking-wider")}>Feature</th>
                <th className={cn(TD_BASE, "font-bold text-slate-900")}>Free</th>
                <th className={cn(CELL_PRO, "font-bold rounded-t-xl")}>Starter</th>
                <th className={cn(TD_BASE, "font-bold text-slate-900")}>Growth</th>
                <th className={cn(TD_BASE, "font-bold text-slate-900")}>Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FEATURE_ROWS.map((row, idx) => (
                <tr key={row.feature} className={idx === FEATURE_ROWS.length - 1 ? "border-b-0" : ""}>
                  <td className={CELL_LABEL}>{row.feature}</td>
                  <FeatureCell value={row.free} />
                  <FeatureCell value={row.starter} isHighlighted />
                  <FeatureCell value={row.growth} />
                  <FeatureCell value={row.scale} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PricingFaqSection() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-6 text-left text-lg font-bold text-slate-900 hover:no-underline hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-slate-500 [&[data-state=open]>svg]:text-brand-primary">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-base leading-relaxed text-brand-foreground-muted">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Still have questions?{" "}
            <Link className="text-black font-bold hover:underline decoration-2" href="/contact">
              Chat with our support team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/*
 * PricingClient
 * Client-side pricing page. Handles plan detection, checkout initiation,
 * and billing portal redirect for existing paid customers.
 */
export function PricingClient() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [pendingTier, setPendingTier] = useState<string | null>(null);
  const [planChangeModal, setPlanChangeModal] = useState<{
    open: boolean;
    mode: "upgrade" | "downgrade";
    targetPlan: string;
    targetPlanId: string;
    period: BillingPeriod;
  } | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useUIStore();

  const userPlan = session?.user?.plan as PlanTier | undefined;
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo =
    requestedReturnTo && isAllowedCheckoutReturnTo(requestedReturnTo)
      ? requestedReturnTo
      : undefined;

  async function handleCtaClick(tierId: string) {
    if (tierId === PricingTierId.FREE) {
      router.push("/register");
      return;
    }

    if (!session?.user) {
      openLoginModal();
      return;
    }

    if (session.user.role === UserRole.SEEKER) {
      toast.error("This plan is for recruiters only");
      return;
    }

    // Current-plan holder → open billing portal
    const isPaidTier =
      tierId === PricingTierId.STARTER ||
      tierId === PricingTierId.GROWTH ||
      tierId === PricingTierId.SCALE;
    const planMatchesTier =
      (userPlan === PlanTier.STARTER && tierId === PricingTierId.STARTER) ||
      (userPlan === PlanTier.GROWTH && tierId === PricingTierId.GROWTH) ||
      (userPlan === PlanTier.SCALE && tierId === PricingTierId.SCALE);

    if (planMatchesTier) {
      setPendingTier(tierId);
      try {
        const res = await fetch("/api/billing/portal", { method: "POST" });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error ?? "Could not open billing portal"); return; }
        window.location.href = json.data.url;
      } catch {
        toast.error("Network error. Try again.");
      } finally {
        setPendingTier(null);
      }
      return;
    }

    // Paid user clicking a different paid tier → open plan change modal
    if (isPaidTier && userPlan && userPlan !== PlanTier.FREE) {
      const TIER_NAMES: Record<string, string> = {
        starter: "Starter", growth: "Growth", scale: "Scale",
      };
      // Determine direction client-side for UX (server will revalidate)
      const PLAN_RANK: Record<string, number> = { FREE: 0, STARTER: 1, GROWTH: 2, SCALE: 3 };
      const currentRank = PLAN_RANK[userPlan] ?? 0;
      const targetRank = PLAN_RANK[tierId.toUpperCase()] ?? 0;
      const mode = targetRank > currentRank ? "upgrade" : "downgrade";
      setPlanChangeModal({
        open: true,
        mode,
        targetPlan: TIER_NAMES[tierId] ?? tierId,
        targetPlanId: tierId,
        period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
      });
      return;
    }

    if (!isPaidTier) return;

    // FREE user clicking a paid tier → initiate checkout
    setPendingTier(tierId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: tierId,
          period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
          currency: "USD",
          ...(returnTo ? { returnTo } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Checkout failed. Try again."); return; }
      window.location.href = json.data.url;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setPendingTier(null);
    }
  }

  return (
    <>
      {/* Hero + Toggle + Cards */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Pricing that scales with your hiring
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Access India&apos;s verified engineers. Pay only for what you unlock.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center justify-center mb-16 relative z-30">
            <div className="bg-slate-100 p-1.5 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  !isAnnual ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-800",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                aria-pressed={isAnnual}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  isAnnual ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-800",
                )}
              >
                Annual
                <span className="bg-brand-primary text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider pointer-events-none">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 5-card grid (Free + 3 paid + Enterprise) */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch px-4 relative z-0">
          {PLAN_TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isAnnual={isAnnual}
              userPlan={userPlan}
              onCtaClick={handleCtaClick}
              isPending={pendingTier === tier.id}
            />
          ))}
        </div>
      </section>

      {planChangeModal && (
        <PlanChangeModal
          open={planChangeModal.open}
          onOpenChange={(open) => setPlanChangeModal(prev => prev ? { ...prev, open } : null)}
          mode={planChangeModal.mode}
          targetPlan={planChangeModal.targetPlan}
          targetPlanId={planChangeModal.targetPlanId}
          period={planChangeModal.period}
          onSuccess={() => {
            setPlanChangeModal(null);
            // Refresh session so userPlan updates
            void router.refresh();
          }}
        />
      )}

      <PricingCompareTable />
      <PricingFaqSection />
    </>
  );
}
