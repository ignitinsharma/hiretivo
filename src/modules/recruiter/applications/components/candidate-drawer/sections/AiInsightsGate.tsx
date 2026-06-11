import { CheckCircle2, Crown, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/* Perks listed on the upgrade gate — mirrors what a generated insight delivers. */
const GATE_FEATURES = [
  "AI generated candidate summary",
  "Skill match analysis",
  "Areas to explore",
  "Suggested screening questions",
] as const;

/*
 * AiInsightsGate
 * Light "Upgrade to Pro" gate shown in place of the AI insights card whenever the
 * feature is locked — both for FREE plans without AI access and after the 3/day
 * free summary limit is exhausted. Matches the candidate-drawer insight card shell.
 * Renders no props; the CTA routes to the pricing page.
 */
export function AiInsightsGate() {
  return (
    <section className="rounded-xl border border-[#ece9fe] bg-[#f5f3ff] p-5">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-base font-semibold text-brand-foreground">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          AI Candidate Insights
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ede9fe] px-2.5 py-1 text-xs font-semibold text-brand-primary">
          <Lock className="h-3 w-3" />
          Pro Feature
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        {/* Skeleton-card illustration with overlaid lock */}
        <div className="relative w-full max-w-xs">
          <div className="space-y-2 rounded-xl border border-[#ece9fe] bg-white/60 p-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[#ede9fe]" />
              <div className="h-2.5 w-24 rounded-full bg-[#ede9fe]" />
              <div className="ml-auto h-4 w-12 rounded-full bg-brand-primary/30" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#ede9fe]" />
            <div className="h-2.5 w-5/6 rounded-full bg-[#ede9fe]" />
            <div className="h-2.5 w-2/3 rounded-full bg-[#ede9fe]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <Sparkles className="absolute -left-1 top-2 h-4 w-4 text-brand-primary/50" />
          <Sparkles className="absolute right-2 -top-2 h-3 w-3 text-brand-primary/40" />
        </div>

        <h3 className="mt-6 text-xl font-bold tracking-tight text-brand-foreground">
          Upgrade to <span className="text-brand-primary">Pro</span> to generate AI summary
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-foreground-muted">
          Get AI-powered insights including skill match, strengths, areas to explore and
          suggested screening questions.
        </p>

        <ul className="mt-5 space-y-2 text-left">
          {GATE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-brand-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary" />
              {feature}
            </li>
          ))}
        </ul>

        <Button variant="primary" size="lg" className="mt-6 w-full max-w-sm" asChild>
          <a href="/pricing">
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </a>
        </Button>
      </div>
    </section>
  );
}
