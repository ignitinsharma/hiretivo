import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PLAN_TIERS } from "@/constants/pricing";

type PlanTierValue = (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS];

interface PricingCardProps {
  tier: PlanTierValue;
  annual: boolean;
}

/*
 * PricingCard
 * Displays one pricing tier with price (monthly or annual), features, and CTA.
 * Highlighted tier (GROWTH) has bg-brand-primary styling.
 */
export function PricingCard({ tier, annual }: PricingCardProps) {
  const price = annual ? tier.annualPrice : tier.price;
  const displayPrice = price === 0 ? "Free" : `$${price}`;
  const isHighlighted = tier.highlighted;

  const cardClass = isHighlighted
    ? "rounded-xl border-2 border-brand-primary bg-brand-primary p-6 flex flex-col gap-4"
    : "rounded-xl border border-brand-border bg-white p-6 flex flex-col gap-4";

  const headingClass = isHighlighted
    ? "text-brand-primary-foreground"
    : "text-brand-foreground";
  const descClass = isHighlighted
    ? "text-brand-primary-foreground/80"
    : "text-brand-foreground-muted";
  const priceClass = isHighlighted
    ? "text-brand-primary-foreground"
    : "text-brand-foreground";
  const featureClass = isHighlighted
    ? "text-brand-primary-foreground/90"
    : "text-brand-foreground-muted";
  const checkClass = isHighlighted
    ? "text-brand-primary-foreground"
    : "text-brand-success";

  return (
    <div className={cardClass}>
      {isHighlighted && (
        <span className="self-start rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-brand-primary-foreground">
          Most Popular
        </span>
      )}
      <div>
        <h3 className={`font-bold text-xl ${headingClass}`}>{tier.name}</h3>
        <p className={`text-sm mt-1 ${descClass}`}>{tier.description}</p>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className={`font-bold text-4xl ${priceClass}`}>
            {displayPrice}
          </span>
          {price > 0 && (
            <span className={`text-sm ${descClass}`}>
              /mo{annual ? " (billed annually)" : ""}
            </span>
          )}
        </div>
        {tier.unlocks !== null ? (
          <p className={`text-xs mt-1 ${descClass}`}>
            {tier.unlocks === 0
              ? "0 unlocks/mo"
              : `${tier.unlocks} profile unlocks/mo`}
          </p>
        ) : (
          <p className={`text-xs mt-1 ${descClass}`}>
            Unlimited profile unlocks
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-2 flex-1">
        {tier.features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className={`h-4 w-4 shrink-0 ${checkClass}`} />
            <span className={`text-sm ${featureClass}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={
          isHighlighted
            ? "secondary"
            : tier.price === 0
              ? "ghost"
              : "primary"
        }
        asChild
        className={
          isHighlighted
            ? "bg-white text-brand-primary hover:bg-brand-surface"
            : ""
        }
      >
        <a
          href={
            tier.price === 0
              ? "/auth/signup?role=recruiter"
              : "/recruiter/settings/billing"
          }
        >
          {tier.price === 0
            ? "Get started free"
            : `Upgrade to ${tier.name} →`}
        </a>
      </Button>
    </div>
  );
}
