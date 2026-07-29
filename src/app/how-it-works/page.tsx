import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  Sparkles,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BrowserFrame } from "@/components/home/BrowserFrame";
import { cn } from "@/lib/utils";
import {
  HIW_HERO,
  HIW_JOURNEY,
  HIW_STEPS,
  HIW_WHY,
  HIW_CTA,
} from "@/config/how-it-works-page";
import type { HiwStep, HiwVisual } from "@/config/how-it-works-page";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "How It Works — Hiretivo",
  description:
    "See exactly how Hiretivo turns any job link into a tailored, ATS-ready resume and tracks it to offer — step by step.",
  path: "/how-it-works",
});

/*
 * StepVisual
 * Renders the framed screenshot / crop / before-after collage for one step.
 */
function StepVisual({ visual }: { visual: HiwVisual }) {
  if (visual.kind === "dual") {
    return (
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 items-start gap-6 sm:grid-cols-2">
        {visual.images!.map((img) => (
          <figure key={img.src} className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-foreground-muted">
              {img.label}
            </span>
            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                className="h-auto w-full"
              />
            </div>
          </figure>
        ))}
      </div>
    );
  }

  if (visual.kind === "before-after") {
    return (
      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute left-0 top-8 z-10 w-[52%] -rotate-3">
          <span className="absolute -top-3 left-3 z-20 rounded-pill border border-brand-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-foreground-muted">
            Before
          </span>
          <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
            <Image
              src="/images/resume-before.png"
              alt="Generic, unoptimized resume with vague bullet points"
              width={1103}
              height={1426}
              className="h-auto w-full"
            />
          </div>
        </div>
        <div className="relative z-20 ml-auto w-[62%] rotate-1">
          <span className="absolute -top-3 right-3 z-20 inline-flex items-center gap-1 rounded-pill bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            After · Hiretivo-optimized
          </span>
          <div className="overflow-hidden rounded-xl border border-brand-primary/30 bg-white">
            <Image
              src="/images/resume-after.png"
              alt="AI-optimized resume with highlighted improvements"
              width={820}
              height={1125}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (visual.kind === "plain") {
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-brand-border bg-white">
        <Image
          src={visual.src!}
          alt={visual.alt!}
          width={visual.width!}
          height={visual.height!}
          className="h-auto w-full"
        />
      </div>
    );
  }

  return (
    <BrowserFrame>
      <Image
        src={visual.src!}
        alt={visual.alt!}
        width={visual.width!}
        height={visual.height!}
        className="h-auto w-full"
      />
    </BrowserFrame>
  );
}

/*
 * StepSection
 * One numbered journey step — alternating text/visual layout.
 */
function StepSection({ step, index }: { step: HiwStep; index: number }) {
  const imageLeft = index % 2 === 1;

  return (
    <section
      className={cn(
        "border-b border-brand-border px-4 py-16 md:px-8 md:py-20",
        imageLeft ? "bg-brand-surface" : "bg-white",
      )}
    >
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
          <div
            className={cn(
              "min-w-0 lg:col-span-3",
              imageLeft ? "lg:order-first" : "lg:order-last",
            )}
          >
            <StepVisual visual={step.visual} />
          </div>

          <div className="min-w-0 lg:col-span-2">
            <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              Step {step.number}
              {(index === 1 || index === 2) && (
                <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" />
              )}
            </p>
            <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              {step.heading}
            </h2>
            <p className="mt-4 break-words text-base leading-relaxed text-brand-foreground-muted">
              {step.body}
            </p>

            <ul className="mt-6 space-y-3" role="list">
              {step.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-relaxed text-brand-foreground">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-brand-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="grid-bg relative overflow-hidden border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="relative z-10 mx-auto max-w-3xl min-w-0 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              {HIW_HERO.eyebrow}
            </p>
            <h1 className="break-words text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground md:text-5xl">
              From job link to offer —{" "}
              <span className="text-brand-primary">
                every step, explained.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              {HIW_HERO.subcopy}
            </p>

            {/* Mini journey map */}
            <ol
              className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-1 gap-y-2"
              aria-label="Journey overview"
            >
              {HIW_JOURNEY.map((label, i) => (
                <li key={label} className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-foreground-muted">
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-brand-primary text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {label}
                  </span>
                  {i < HIW_JOURNEY.length - 1 && (
                    <ChevronRight
                      className="h-3.5 w-3.5 text-brand-foreground-secondary"
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="primary" size="lg">
                <Link href="/seeker/register">
                  Start Free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/dashboard/browse">Browse Open Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 6 steps */}
        {HIW_STEPS.map((step, index) => (
          <StepSection key={step.number} step={step} index={index} />
        ))}

        {/* Why Hiretivo */}
        <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl min-w-0">
            <div className="mx-auto mb-14 max-w-2xl min-w-0 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
                {HIW_WHY.eyebrow}
              </p>
              <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
                {HIW_WHY.heading}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HIW_WHY.cards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-brand-border bg-white p-6 transition-colors hover:border-brand-primary/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold leading-snug tracking-tight text-brand-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-surface px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <div className="relative overflow-hidden rounded-xl border border-brand-border bg-white">
              <span
                className="absolute left-0 top-0 h-full w-1 bg-brand-primary"
                aria-hidden="true"
              />

              <div className="px-6 py-12 text-center sm:px-10 lg:px-16">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  {HIW_CTA.eyebrow}
                </p>
                <h2 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-5xl">
                  {HIW_CTA.heading}
                  <br />
                  <span className="text-brand-primary">{HIW_CTA.subheading}</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-brand-foreground-muted md:text-lg">
                  {HIW_CTA.body}
                </p>

                <div className="mt-10 flex justify-center">
                  <Button asChild variant="primary" size="lg">
                    <Link href={HIW_CTA.buttonHref}>
                      {HIW_CTA.buttonText}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="mx-auto mt-10 grid max-w-sm gap-2 rounded-xl border border-brand-border bg-white p-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-full bg-brand-surface px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/[0.08] text-brand-primary">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-xs font-semibold text-brand-foreground">
                      2 Free / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-brand-surface px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/[0.08] text-brand-primary">
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-xs font-semibold text-brand-foreground">
                      No Credit Card
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-brand-surface px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/[0.08] text-brand-primary">
                      <Zap className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-xs font-semibold text-brand-foreground">
                      5-min Setup
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
