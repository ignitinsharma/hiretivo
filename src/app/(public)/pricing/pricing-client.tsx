"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CircleCheck, CirclePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserRole, PlanTier } from "@/constants/enums";
import { useUIStore } from "@/store/use-ui-store";
import {
  PRICING_CONFIG,
  CURRENCY_SYMBOL,
  type PricingCurrency,
  type PricingTier,
} from "@/constants/pricing";

// ─── Table cell class constants (CLAUDE.md §15.2) ───────────────────────────

const TD_BASE = "py-6 px-4 text-sm";
const CELL_LABEL = cn(TD_BASE, "font-semibold text-slate-700");
const CELL_MUTED = cn(TD_BASE, "text-slate-400");
const CELL_BODY = cn(TD_BASE, "text-slate-600");
const CELL_PRO = cn(TD_BASE, "font-bold text-brand-primary bg-brand-primary-light/50");
const CELL_CHECK_GREEN = cn(TD_BASE, "text-emerald-500 font-bold");
const CELL_PRO_CHECK = cn(TD_BASE, "font-bold text-brand-primary bg-brand-primary-light/50");

// ─── Feature comparison data (CLAUDE.md §15.4) ──────────────────────────────

type PlanValue = string | boolean | null;

interface FeatureRow {
  feature: string;
  free: PlanValue;
  pro: PlanValue;
  enterprise: PlanValue;
}

const FEATURE_ROWS: FeatureRow[] = [
  { feature: "Active Jobs",                free: "1",       pro: "8",         enterprise: "Unlimited"            },
  { feature: "Applicant View Limit",       free: "20/mo",   pro: "Unlimited", enterprise: "Unlimited"            },
  { feature: "AI Candidate Matching",      free: "Basic",   pro: "Yes",       enterprise: "Advanced Assistant"   },
  { feature: "Candidate Contact Info",     free: null,      pro: true,        enterprise: true                   },
  { feature: "Resume Database Search",     free: null,      pro: "Unlimited", enterprise: "Unlimited"            },
  { feature: "AI Candidate Ranking",       free: null,      pro: true,        enterprise: true                   },
  { feature: "Smart Interview Scheduling", free: null,      pro: true,        enterprise: true                   },
  { feature: "ATS Dashboard",             free: null,      pro: "Yes",       enterprise: "Internal Integration" },
  { feature: "API Access",                free: null,      pro: null,        enterprise: true                   },
  { feature: "Support",                   free: "Email",   pro: "Priority",  enterprise: "Dedicated Manager"    },
  { feature: "Team Seats",                free: null,      pro: "3",         enterprise: "Unlimited"            },
];

// ─── FAQ data (CLAUDE.md §15.4) ─────────────────────────────────────────────

interface FaqItem {
  question: string;
}

const FAQ_ITEMS: FaqItem[] = [
  { question: "Can I change plans later?" },
  { question: "What payment methods do you accept?" },
  { question: "Is there a free trial for PRO?" },
  { question: "What happens to my listings if I downgrade?" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FeatureCellProps {
  value: PlanValue;
  isPro?: boolean;
}

function FeatureCell({ value, isPro = false }: FeatureCellProps) {
  if (value === null) {
    return <td className={isPro ? CELL_PRO : CELL_MUTED}>—</td>;
  }
  if (value === true) {
    return <td className={isPro ? CELL_PRO_CHECK : CELL_CHECK_GREEN}>✓</td>;
  }
  return <td className={isPro ? CELL_PRO : CELL_BODY}>{value}</td>;
}

interface PricingCardProps {
  tier: PricingTier;
  currency: PricingCurrency;
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
              highlighted
                ? "fill-white text-brand-primary"
                : "fill-brand-primary text-white"
            )}
            size={16}
            strokeWidth={2.5}
            aria-hidden
          />
          <span
            className={cn(
              "text-xs",
              highlighted ? "text-indigo-50" : "text-slate-700"
            )}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PricingCard({
  tier,
  currency,
  isAnnual,
  userPlan,
  onCtaClick,
  isPending = false,
}: PricingCardProps) {
  const sym = CURRENCY_SYMBOL[currency];
  const prices = tier[currency];
  const isHighlighted = tier.highlighted === true;
  const isEnterprise = tier.isEnterprise === true;
  const isCurrentPlan = userPlan === PlanTier.PRO && tier.id === "pro";

  const displayedCtaText = isCurrentPlan ? "Manage Plan" : tier.cta;

  const displayedPrice = (() => {
    if (isEnterprise && tier.startingPrice) {
      const sp = tier.startingPrice[currency];
      return isAnnual ? sp.annual : sp.monthly;
    }
    if (!prices) return null;
    return isAnnual ? prices.annual : prices.monthly;
  })();

  const annualSavings = prices && isAnnual ? prices.annualSavings : null;
  const annualTotal = prices && isAnnual ? prices.annualTotal : null;

  return (
    <div
      className={cn(
        "p-6 rounded-2xl flex flex-col h-full text-left relative",
        isHighlighted
          ? "bg-brand-primary border-2 border-brand-primary shadow-xl transform lg:scale-105 z-10 text-white"
          : "bg-white border border-slate-200 shadow-sm"
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-brand-primary text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-md whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3
          className={cn(
            "font-bold uppercase tracking-wider text-xs mb-2",
            isHighlighted ? "text-indigo-100" : "text-slate-900"
          )}
        >
          {tier.name}
        </h3>
        <p
          className={cn(
            "text-xs mb-4 min-h-[32px]",
            isHighlighted ? "text-indigo-100" : "text-slate-500"
          )}
        >
          {tier.description}
        </p>

        {isEnterprise ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">
                Starting at {sym}{displayedPrice}/mo
              </span>
            </div>
            <p className="mt-2 text-slate-400 text-[10px]">Custom contract</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-4xl font-extrabold",
                  isHighlighted ? "text-white" : "text-slate-900"
                )}
              >
                {sym}{displayedPrice}
              </span>
              <span
                className={cn(
                  "text-sm ml-1",
                  isHighlighted ? "text-indigo-200" : "text-slate-500"
                )}
              >
                /mo
              </span>
            </div>
            {tier.id === "free" && (
              <p className="mt-2 text-slate-400 text-[10px]">Forever free</p>
            )}
          </>
        )}
      </div>

      {!isEnterprise && tier.id !== "free" && (
        <div
          className={cn(
            "p-2.5 rounded-lg mb-6 text-center",
            isHighlighted ? "bg-white/10" : "bg-indigo-50"
          )}
        >
          {isAnnual && annualSavings && annualTotal ? (
            <p
              className={cn(
                "text-[10px] font-bold",
                isHighlighted ? "text-white" : "text-brand-primary"
              )}
            >
              Save {sym}{annualSavings}/yr · {sym}{annualTotal} billed annually
            </p>
          ) : (
            <p
              className={cn(
                "text-[10px] font-bold",
                isHighlighted ? "text-white" : "text-slate-600"
              )}
            >
              Billed monthly
            </p>
          )}
        </div>
      )}

      {tier.id === "free" && (
        <div className="h-px bg-slate-100 mb-6" />
      )}

      {isEnterprise && (
        <div className="h-px bg-slate-100 mb-6" />
      )}

      <PricingCardFeatureList
        features={tier.features}
        highlighted={isHighlighted}
      />

      {isEnterprise ? (
        <Link href="/contact" className="w-full mt-auto">
          <Button variant="outline" size="lg" className="w-full">
            {tier.cta}
          </Button>
        </Link>
      ) : (
        <Button
          variant={isHighlighted ? "primary" : "outline"}
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

function PricingCompareTable(_props: { isAnnual: boolean }) {
  // isAnnual reserved for future dynamic feature cells
  return (
    <section className="py-24 px-6 overflow-x-auto border-t border-slate-100">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-16">
          Compare features
        </h2>
        <div className="min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className={cn(TD_BASE, "font-bold text-slate-500 uppercase tracking-wider")}>
                  Feature
                </th>
                <th className={cn(TD_BASE, "font-bold text-slate-900")}>Free</th>
                <th className={cn(CELL_PRO, "font-bold rounded-t-xl")}>PRO</th>
                <th className={cn(TD_BASE, "font-bold text-slate-900")}>Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FEATURE_ROWS.map((row, idx) => (
                <tr key={row.feature} className={idx === FEATURE_ROWS.length - 1 ? "border-b-0" : ""}>
                  <td className={CELL_LABEL}>{row.feature}</td>
                  <FeatureCell value={row.free} />
                  <FeatureCell value={row.pro} isPro />
                  <FeatureCell value={row.enterprise} />
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
        <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.question}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden group"
            >
              <div className="p-6 flex items-center justify-between cursor-pointer">
                <h4 className="font-bold text-lg text-slate-900">
                  {item.question}
                </h4>
                <CirclePlus
                  className="h-6 w-6 shrink-0 fill-slate-100 text-slate-500 transition-colors group-hover:fill-brand-primary-light group-hover:text-brand-primary"
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Still have questions?{" "}
            <Link
              className="text-brand-primary font-bold hover:underline decoration-2"
              href="/contact"
            >
              Chat with our support team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PricingClientProps {
  currency: PricingCurrency;
}

interface StripeSessionResponse {
  data?: {
    url?: string | null;
  };
  error?: string;
}

async function parseStripeSessionResponse(
  response: Response,
): Promise<string> {
  const payload = (await response.json()) as StripeSessionResponse;

  if (!response.ok || !payload.data?.url) {
    throw new Error(payload.error ?? "Billing is unavailable right now");
  }

  return payload.data.url;
}

async function createCheckoutSession(
  body?: unknown,
): Promise<string> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseStripeSessionResponse(response);
}

async function createPortalSession(): Promise<string> {
  const response = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  return parseStripeSessionResponse(response);
}

export function PricingClient({ currency }: PricingClientProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { openLoginModal } = useUIStore();

  const userPlan = session?.user?.plan as PlanTier | undefined;
  const checkoutMutation = useMutation({
    mutationFn: () =>
      createCheckoutSession({
        planId: "pro",
        period: isAnnual ? "annual" : "monthly",
        currency,
      }),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleCtaClick(tierId: string) {
    if (tierId === "free") {
      router.push("/register");
      return;
    }

    if (tierId === "pro") {
      if (!session?.user) {
        openLoginModal();
        return;
      }
      if (session.user.role === UserRole.SEEKER) {
        toast.error("This plan is for recruiters only");
        return;
      }

      if (session.user.plan === PlanTier.PRO) {
        portalMutation.mutate();
        return;
      }

      checkoutMutation.mutate();
      return;
    }
  }

  return (
    <>
      {/* Hero + Toggle + Cards */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0A0A0F] tracking-tight mb-6">
            Pricing that scales with your hiring
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Choose the plan that fits your team&apos;s needs. Join 5,000+ remote-first companies.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center justify-center mb-16 relative z-30">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner border border-slate-200">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                aria-pressed={!isAnnual}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  !isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
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
                  isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Annual
                <span className="bg-[#10b981] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider pointer-events-none">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-card grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch px-4 relative z-0">
          {PRICING_CONFIG.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currency={currency}
              isAnnual={isAnnual}
              userPlan={userPlan}
              onCtaClick={handleCtaClick}
              isPending={
                tier.id === "pro" &&
                (checkoutMutation.isPending || portalMutation.isPending)
              }
            />
          ))}
        </div>
      </section>

      <PricingCompareTable isAnnual={isAnnual} />
      <PricingFaqSection />
    </>
  );
}
