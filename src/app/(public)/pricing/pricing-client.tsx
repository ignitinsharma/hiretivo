"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
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
  CurrencyCode,
  PricingTierId,
  UserRole,
  PlanTier,
} from "@/constants/enums";
import { useUIStore } from "@/store/use-ui-store";
import { billingService } from "@/services/billing.service";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import { PRICING_CONFIG, CURRENCY_SYMBOL, type PricingTier } from "@/constants/pricing";
import type { CheckoutRequestInput } from "@/lib/validations/checkout.schema";

// ─── Table cell class constants ──────────────────────────────────────────────

const TD_BASE = "py-5 px-3 text-sm";
const CELL_LABEL = cn(TD_BASE, "font-semibold text-brand-foreground");
const CELL_MUTED = cn(TD_BASE, "text-brand-foreground-secondary");
const CELL_BODY = cn(TD_BASE, "text-brand-foreground-muted");
const CELL_HIGHLIGHT = cn(TD_BASE, "font-bold text-brand-foreground bg-brand-surface");

// ─── Feature comparison data ─────────────────────────────────────────────────

interface FeatureRow {
  feature: string;
  free: string | boolean | null;
  starter: string | boolean | null;
  growth: string | boolean | null;
  scale: string | boolean | null;
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    feature: "Browse verified engineers",
    free: true,
    starter: true,
    growth: true,
    scale: true,
  },
  {
    feature: "Engineer unlocks / month",
    free: "0",
    starter: "10",
    growth: "30",
    scale: "Unlimited",
  },
  {
    feature: "Active job posts",
    free: "0",
    starter: "2",
    growth: "Unlimited",
    scale: "Unlimited",
  },
  {
    feature: "Priority match scoring",
    free: null,
    starter: null,
    growth: true,
    scale: true,
  },
  {
    feature: "Direct email + scheduling",
    free: null,
    starter: true,
    growth: true,
    scale: true,
  },
  {
    feature: "Save engineers to shortlist",
    free: true,
    starter: true,
    growth: true,
    scale: true,
  },
  {
    feature: "Support",
    free: "Email",
    starter: "Email",
    growth: "Email",
    scale: "Dedicated",
  },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does an 'unlock' mean?",
    answer:
      "Unlocking an engineer reveals their full contact details — email, GitHub, and LinkedIn URL. Each cold unlock from the talent pool costs 1 credit from your monthly quota. If an engineer applies to your job, you see their profile for free with no quota charge.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. Use the billing management portal from your recruiter settings to upgrade or cancel anytime. Cancellations take effect at the end of the current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Checkout is handled securely through Dodo Payments. Available methods depend on your region and are shown at checkout.",
  },
  {
    question: "What happens to unlocked engineers if I downgrade?",
    answer:
      "Once unlocked, engineers remain accessible permanently — even after plan changes. Quota is reset at the start of each billing period.",
  },
  {
    question: "What happens to my jobs if I downgrade to a lower plan?",
    answer:
      "Excess OPEN jobs are automatically set to DRAFT when you downgrade. They are not deleted — you can re-open them if you upgrade again.",
  },
  {
    question: "Are engineers always free?",
    answer:
      "Yes. Engineers never pay. The Hiretivo Verified badge, public profile, and job applications are always free for engineers.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

type PlanValue = string | boolean | null;

function FeatureCell({ value, isHighlight = false }: { value: PlanValue; isHighlight?: boolean }) {
  const base = isHighlight ? CELL_HIGHLIGHT : CELL_BODY;
  if (value === null) return <td className={isHighlight ? CELL_HIGHLIGHT : CELL_MUTED}>—</td>;
  if (value === true) return <td className={base}>✓</td>;
  return <td className={base}>{value}</td>;
}

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
  userPlan?: PlanTier;
  onCtaClick: (tierId: string) => void;
  isPending?: boolean;
}

function PricingCardFeatureList({ features, highlighted }: { features: string[]; highlighted: boolean }) {
  return (
    <ul className="space-y-3 mb-8 grow">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <CircleCheck
            className={cn("mt-0.5 shrink-0", highlighted ? "fill-white text-brand-primary" : "fill-brand-primary text-white")}
            size={16}
            strokeWidth={2.5}
            aria-hidden
          />
          <span className={cn("text-xs", highlighted ? "text-gray-50" : "text-brand-foreground-muted")}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PricingCard({ tier, isAnnual, userPlan, onCtaClick, isPending = false }: PricingCardProps) {
  const prices = tier.USD;
  const isHighlighted = tier.highlighted === true;
  const isFree = tier.id === PricingTierId.FREE;

  const tierToPlan: Partial<Record<string, PlanTier>> = {
    [PricingTierId.STARTER]: PlanTier.STARTER,
    [PricingTierId.GROWTH]:  PlanTier.GROWTH,
    [PricingTierId.SCALE]:   PlanTier.SCALE,
    [PricingTierId.FREE]:    PlanTier.FREE,
  };
  const isCurrentPlan = userPlan !== undefined && userPlan === tierToPlan[tier.id];

  const ctaText = isCurrentPlan ? "Manage billing" : tier.cta;

  const priceFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const displayedPrice = prices
    ? isAnnual ? prices.annualTotal : prices.monthly
    : null;
  const annualSavings = prices && isAnnual ? prices.annualSavings : null;
  const annualTotal = prices && isAnnual ? prices.annualTotal : null;

  return (
    <div
      className={cn(
        "p-6 rounded-xl flex flex-col h-full text-left relative",
        isHighlighted
          ? "bg-brand-primary border-2 border-brand-primary lg:scale-105 z-10 text-white"
          : "bg-white border border-brand-border",
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-brand-foreground text-[10px] font-bold px-4 py-1 rounded-full uppercase whitespace-nowrap">
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
        <h3 className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isHighlighted ? "text-gray-100" : "text-brand-foreground")}>
          {tier.name}
        </h3>
        <p className={cn("text-xs mb-4 min-h-8", isHighlighted ? "text-gray-100" : "text-brand-foreground-muted")}>
          {tier.description}
        </p>

        <div className="flex items-baseline gap-1">
          <span className={cn("text-4xl font-bold", isHighlighted ? "text-white" : "text-brand-foreground")}>
            {displayedPrice === null ? "" : `${CURRENCY_SYMBOL}${priceFormatter.format(displayedPrice)}`}
          </span>
          {!isFree && (
            <span className={cn("text-sm ml-1", isHighlighted ? "text-gray-200" : "text-brand-foreground-muted")}>
              {isAnnual ? "/yr" : "/mo"}
            </span>
          )}
        </div>

        {isFree && (
          <p className="mt-2 text-xs text-brand-foreground-secondary">Forever free for engineers & recruiters</p>
        )}
      </div>

      {!isFree && (
        <div className={cn("p-2.5 rounded-lg mb-6 text-center", isHighlighted ? "bg-white/10" : "bg-brand-surface")}>
          {isAnnual && annualSavings !== null && annualTotal !== null ? (
            <p className={cn("text-[10px] font-bold", isHighlighted ? "text-white" : "text-brand-foreground")}>
              {`Save ${CURRENCY_SYMBOL}${priceFormatter.format(annualSavings)}/yr · ${CURRENCY_SYMBOL}${priceFormatter.format(annualTotal)} billed annually`}
            </p>
          ) : (
            <p className={cn("text-[10px] font-bold", isHighlighted ? "text-white" : "text-brand-foreground-muted")}>
              Billed monthly
            </p>
          )}
        </div>
      )}

      {isFree && <div className={cn("h-px mb-6", isHighlighted ? "bg-white/20" : "bg-brand-border")} />}

      <PricingCardFeatureList features={tier.features} highlighted={isHighlighted} />

      <Button
        variant={isHighlighted ? "primary" : "secondary"}
        size="lg"
        className="w-full mt-auto"
        loading={isPending}
        loadingText={isCurrentPlan ? "Opening billing..." : "Opening checkout..."}
        onClick={() => onCtaClick(tier.id)}
      >
        {ctaText}
      </Button>
    </div>
  );
}

function PricingCompareTable({ isAnnual: _isAnnual }: { isAnnual: boolean }) {
  return (
    <section className="py-24 px-6 overflow-x-auto border-t border-brand-border">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-brand-foreground mb-16">
          Compare plans
        </h2>
        <div className="min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-brand-border">
                <th className={cn(TD_BASE, "font-bold text-brand-foreground-muted uppercase tracking-wider")}>Feature</th>
                <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Free</th>
                <th className={cn(CELL_HIGHLIGHT, "font-bold rounded-t-xl")}>Starter</th>
                <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Growth</th>
                <th className={cn(TD_BASE, "font-bold text-brand-foreground")}>Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {FEATURE_ROWS.map((row, idx) => (
                <tr key={row.feature} className={idx === FEATURE_ROWS.length - 1 ? "border-b-0" : ""}>
                  <td className={CELL_LABEL}>{row.feature}</td>
                  <FeatureCell value={row.free} />
                  <FeatureCell value={row.starter} isHighlight />
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
    <section className="py-24 px-6 bg-brand-surface">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-brand-foreground mb-16">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="bg-white rounded-xl border border-brand-border overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-6 text-left text-lg font-bold text-brand-foreground hover:no-underline hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-brand-foreground-secondary [&[data-state=open]>svg]:text-brand-primary">
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
            <Link className="text-brand-foreground font-bold hover:underline decoration-2" href="/contact">
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
 * Renders the full pricing page: hero + annual toggle, 4-tier card grid,
 * feature comparison table, and FAQ. Handles checkout and portal mutations
 * for each tier. USD only.
 */
export function PricingClient() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { openLoginModal, openEmailVerificationModal } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();

  const userPlan = session?.user?.plan as PlanTier | undefined;

  const tierIdToPlanTier: Partial<Record<string, PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE>> = {
    [PricingTierId.STARTER]: PlanTier.STARTER,
    [PricingTierId.GROWTH]:  PlanTier.GROWTH,
    [PricingTierId.SCALE]:   PlanTier.SCALE,
  };

  const [pendingTierId, setPendingTierId] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: (body: CheckoutRequestInput) => billingService.createCheckoutSession(body),
    onSuccess: (url) => { window.location.href = url; },
    onError: (error: Error) => {
      toast.error(error.message);
      setPendingTierId(null);
    },
  });

  const portalMutation = useMutation({
    mutationFn: billingService.createPortalSession,
    onSuccess: (url) => { window.location.href = url; },
    onError: (error: Error) => {
      toast.error(error.message);
      setPendingTierId(null);
    },
  });

  function handleCtaClick(tierId: string) {
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

    // Already on this plan → open portal to manage
    const planForTier = tierIdToPlanTier[tierId];
    if (planForTier && session.user.plan === planForTier) {
      setPendingTierId(tierId);
      portalMutation.mutate();
      return;
    }

    // Already on ANY paid plan → portal for upgrades/downgrades
    if (
      session.user.plan === PlanTier.STARTER ||
      session.user.plan === PlanTier.GROWTH ||
      session.user.plan === PlanTier.SCALE
    ) {
      setPendingTierId(tierId);
      portalMutation.mutate();
      return;
    }

    // FREE → paid: verify email first
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    setPendingTierId(tierId);
    checkoutMutation.mutate({
      planId: tierId as CheckoutRequestInput["planId"],
      period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
      currency: CurrencyCode.USD,
    });
  }

  const isMutating = checkoutMutation.isPending || portalMutation.isPending;

  return (
    <>
      {/* Hero + Toggle + Cards */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-foreground tracking-tight mb-6">
            Hire verified Indian engineers
          </h1>
          <p className="text-lg md:text-xl text-brand-foreground-muted mb-10 max-w-2xl mx-auto">
            Browse free. Unlock when ready. Cancel anytime.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center justify-center mb-16 relative z-30">
            <div className="bg-brand-surface p-1.5 rounded-xl flex items-center border border-brand-border">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  !isAnnual ? "bg-white text-brand-foreground" : "text-brand-foreground-muted hover:text-brand-foreground",
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
                  isAnnual ? "bg-white text-brand-foreground" : "text-brand-foreground-muted hover:text-brand-foreground",
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

        {/* 4-card grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch px-4 relative z-0">
          {PRICING_CONFIG.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isAnnual={isAnnual}
              userPlan={userPlan}
              onCtaClick={handleCtaClick}
              isPending={isMutating && pendingTierId === tier.id}
            />
          ))}
        </div>
      </section>

      <PricingCompareTable isAnnual={isAnnual} />
      <PricingFaqSection />
    </>
  );
}
