"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Check, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BillingPeriod, CurrencyCode, PlanTier, UserRole } from "@/constants/enums";
import {
  CURRENCY_SYMBOL,
  PRICING_CONFIG,
  type PricingCurrency,
  type PricingTier,
} from "@/constants/pricing";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";
import { cn } from "@/lib/utils";
import { billingService } from "@/services/billing.service";
import { useUIStore } from "@/store/use-ui-store";

interface PricingClientProps {
  currency: PricingCurrency;
}

function getBrowserCurrencyFallback(): PricingCurrency {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  if (
    timeZone === "Asia/Kolkata" ||
    timeZone === "Asia/Calcutta" ||
    languages.some((language) => language.toLowerCase().endsWith("-in"))
  ) {
    return CurrencyCode.INR;
  }

  return CurrencyCode.USD;
}

function PricingCard({
  tier,
  currency,
  isAnnual,
  userPlan,
  onCtaClick,
  isPending,
}: {
  tier: PricingTier;
  currency: PricingCurrency;
  isAnnual: boolean;
  userPlan?: PlanTier;
  onCtaClick: (tierId: PlanTier) => void;
  isPending: boolean;
}) {
  const prices = tier[currency] ?? tier.USD;
  const price = isAnnual ? prices.annualTotal : prices.monthly;
  const formatter = new Intl.NumberFormat(currency === CurrencyCode.INR ? "en-IN" : "en-US", {
    maximumFractionDigits: 0,
  });
  const isCurrentPlan = userPlan === tier.id;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border p-6 text-left",
        tier.highlighted
          ? "border-brand-primary bg-brand-primary text-brand-primary-foreground"
          : "border-brand-border bg-white text-brand-foreground",
      )}
    >
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold leading-snug tracking-tight">{tier.name}</h3>
          {isCurrentPlan && (
            <span
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium",
                tier.highlighted
                  ? "border-white/30 text-white"
                  : "border-brand-border text-brand-foreground-muted",
              )}
            >
              Current
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-2 min-h-12 text-sm leading-relaxed",
            tier.highlighted ? "text-white/85" : "text-brand-foreground-muted",
          )}
        >
          {tier.description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">
            {CURRENCY_SYMBOL[currency]}
            {formatter.format(price)}
          </span>
          {tier.id !== PlanTier.FREE && (
            <span className={cn("text-sm", tier.highlighted ? "text-white/80" : "text-brand-foreground-muted")}>
              /{isAnnual ? "yr" : "mo"}
            </span>
          )}
        </div>
        {tier.id === PlanTier.FREE ? (
          <p className={cn("mt-2 text-xs", tier.highlighted ? "text-white/80" : "text-brand-foreground-muted")}>
            Forever free
          </p>
        ) : (
          <p className={cn("mt-2 text-xs", tier.highlighted ? "text-white/80" : "text-brand-foreground-muted")}>
            {isAnnual ? "20% annual savings" : "Billed monthly"}
          </p>
        )}
      </div>

      <ul className="mb-8 flex grow flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={tier.highlighted ? "secondary" : "primary"}
        size="lg"
        className="mt-auto w-full"
        loading={isPending}
        loadingText={isCurrentPlan ? "Opening billing..." : "Opening checkout..."}
        onClick={() => onCtaClick(tier.id)}
      >
        {isCurrentPlan && tier.id !== PlanTier.FREE ? "Manage billing" : tier.cta}
      </Button>
    </article>
  );
}

export function PricingClient({ currency }: PricingClientProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<PricingCurrency>(currency);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE>(
    PlanTier.STARTER,
  );
  const router = useRouter();
  const { data: session } = useSession();
  const { openEmailVerificationModal, openLoginModal } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();

  useEffect(() => {
    setActiveCurrency((currentCurrency) => {
      if (currentCurrency === CurrencyCode.INR) return currentCurrency;
      return getBrowserCurrencyFallback();
    });
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: (planId: PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE) =>
      billingService.createCheckoutSession({
        planId,
        period: isAnnual ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY,
        currency: activeCurrency,
      }),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = useMutation({
    mutationFn: billingService.createPortalSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleCtaClick(tierId: PlanTier) {
    if (tierId === PlanTier.FREE) {
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

    if (session.user.plan === tierId) {
      portalMutation.mutate();
      return;
    }

    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    if (tierId === PlanTier.STARTER || tierId === PlanTier.GROWTH || tierId === PlanTier.SCALE) {
      setSelectedPlan(tierId);
      checkoutMutation.mutate(tierId);
    }
  }

  return (
    <>
      <section className="px-6 py-20 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            Pricing that scales with verified hiring
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-foreground-muted md:text-lg">
            Choose the recruiter plan that matches your hiring volume.
          </p>

          <div className="mt-10 inline-flex rounded-xl border border-brand-border bg-brand-surface p-1">
            <button
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                !isAnnual ? "bg-white text-brand-foreground" : "text-brand-foreground-muted",
              )}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                isAnnual ? "bg-white text-brand-foreground" : "text-brand-foreground-muted",
              )}
              onClick={() => setIsAnnual(true)}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRICING_CONFIG.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currency={activeCurrency}
              isAnnual={isAnnual}
              userPlan={session?.user?.plan as PlanTier | undefined}
              isPending={
                tier.id === selectedPlan &&
                (checkoutMutation.isPending || portalMutation.isPending)
              }
              onCtaClick={handleCtaClick}
            />
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="px-4 py-4 font-semibold text-brand-foreground">Feature</th>
                <th className="px-4 py-4 font-semibold text-brand-foreground">Free</th>
                <th className="px-4 py-4 font-semibold text-brand-foreground">Starter</th>
                <th className="px-4 py-4 font-semibold text-brand-foreground">Growth</th>
                <th className="px-4 py-4 font-semibold text-brand-foreground">Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {[
                ["Active jobs", "0", "2", "Unlimited", "Unlimited"],
                ["Engineer unlocks", "0", "10", "30", "Unlimited"],
                ["Verified talent pool", false, true, true, true],
                ["Interview scheduling", false, true, true, true],
              ].map(([feature, free, starter, growth, scale]) => (
                <tr key={String(feature)}>
                  {[feature, free, starter, growth, scale].map((value, index) => (
                    <td key={`${feature}-${index}`} className="px-4 py-4 text-brand-foreground-muted">
                      {typeof value === "boolean" ? (
                        value ? <Check className="h-4 w-4 text-brand-primary" /> : "-"
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
