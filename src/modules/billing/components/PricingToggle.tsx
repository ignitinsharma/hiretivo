"use client";

interface PricingToggleProps {
  annual: boolean;
  onChange: (annual: boolean) => void;
}

/*
 * PricingToggle
 * Monthly / Annual billing toggle for pricing page.
 * Annual = 2 months free (approx 17% off).
 */
export function PricingToggle({ annual, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <button
        onClick={() => onChange(false)}
        className={`text-sm font-medium transition-colors ${
          !annual ? "text-brand-foreground" : "text-brand-foreground-muted"
        }`}
      >
        Monthly
      </button>
      <button
        role="switch"
        aria-checked={annual}
        onClick={() => onChange(!annual)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
          annual ? "bg-brand-primary" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            annual ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          annual ? "text-brand-foreground" : "text-brand-foreground-muted"
        }`}
      >
        Annual
        <span className="rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-semibold text-brand-success">
          2 months free
        </span>
      </button>
    </div>
  );
}
