"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingCard } from "@/modules/billing/components/PricingCard";
import { PricingToggle } from "@/modules/billing/components/PricingToggle";
import { PLAN_TIERS } from "@/constants/pricing";

/*
 * PricingPage
 * Talent marketplace pricing page showing FREE/STARTER/GROWTH/SCALE tiers.
 * Monthly/annual toggle: annual = 2 months free (~17% off).
 */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const tiers = [
    PLAN_TIERS.FREE,
    PLAN_TIERS.STARTER,
    PLAN_TIERS.GROWTH,
    PLAN_TIERS.SCALE,
  ];

  return (
    <>
      <Header />
      <main className="bg-white px-4 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="font-bold text-4xl text-brand-foreground tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mt-3 text-brand-foreground-muted text-base">
              Unlock verified Indian engineers for your US/EU startup
            </p>
          </div>

          <div className="mb-8">
            <PricingToggle annual={annual} onChange={setAnnual} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} annual={annual} />
            ))}
          </div>

          <p className="text-center text-sm text-brand-foreground-secondary mt-8">
            All plans include access to the engineer dashboard, verification
            badge, and direct messaging. Cancel anytime.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
