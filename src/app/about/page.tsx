import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Sparkles, Zap, Search, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOMEPAGE_STATS, SEEKER_STEPS } from "@/config/home-page";
import { generatePageMetadata } from "@/lib/metadata";
import Link from "next/link";

export const metadata = generatePageMetadata({
  title: "About Us — Hiretivo",
  description:
    "We built the fastest way to turn any job link into a tailored, ATS-ready resume. AI-powered resumes, unified tracking, no spreadsheets.",
  path: "/about",
});

const MISSION_COPY = {
  quote:
    "Every job seeker deserves a resume that actually gets seen — and a clear path from browse to offer.",
  paragraphs: [
    "Every job seeker knows the drill — paste the same resume everywhere, tweak nothing, hope for the best. The result: 98% of resumes never pass ATS screening. We got tired of watching talented people lose out to bad formatting and generic bullet points.",
    "Hiretivo was built to solve one problem: turning a job link into a tailored, ATS-ready resume in seconds — then tracking every application from applied to offer. No fluff. No generic templates. Just a faster, clearer path to your next role.",
  ],
};

const VALUES = [
  {
    title: "AI-powered, human-first",
    description:
      "AI writes the draft. You own every word. Edit, tweak, and make it yours before sending.",
    icon: Sparkles,
    tone: "primary" as const,
  },
  {
    title: "Speed without compromise",
    description:
      "30 seconds from job link to tailored resume. Because the best listing won't wait for you to reformat a Word doc.",
    icon: Zap,
    tone: "surface" as const,
  },
  {
    title: "Transparency",
    description:
      "No hidden limits, no lost spreadsheets. Every application stage visible — from saved to applied to interview to offer.",
    icon: Heart,
    tone: "white" as const,
  },
];

const STEP_ICONS = [Search, FileText, LayoutDashboard];

const TONE_BORDER = {
  primary: "border-brand-primary/25",
  surface: "border-brand-border",
  white: "border-brand-border",
} as const;

const TONE_BG = {
  primary: "bg-brand-primary",
  surface: "bg-brand-surface",
  white: "bg-white",
} as const;

const TONE_TEXT = {
  primary: "text-white",
  surface: "text-brand-foreground",
  white: "text-brand-foreground",
} as const;

const TONE_DESC = {
  primary: "text-white/85",
  surface: "text-brand-foreground-muted",
  white: "text-brand-foreground-muted",
} as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-brand-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="grid-bg relative overflow-hidden border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="relative z-10 mx-auto max-w-3xl min-w-0 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              About Hiretivo
            </p>
            <h1 className="break-words text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground md:text-5xl">
              We&apos;re building the fastest way from{" "}
              <span className="text-brand-primary">job link to interview</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl break-words text-base leading-relaxed text-brand-foreground-muted md:text-lg">
              Hiretivo replaces generic copy-paste resumes and forgotten
              spreadsheets with AI-tailored applications and one-click tracking.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {HOMEPAGE_STATS.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="text-lg font-bold text-brand-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-brand-foreground-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl min-w-0">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="min-w-0">
                <blockquote className="text-2xl font-bold leading-snug tracking-tight text-brand-foreground md:text-3xl">
                  &ldquo;{MISSION_COPY.quote}&rdquo;
                </blockquote>
              </div>
              <div className="min-w-0 space-y-5 text-base leading-relaxed text-brand-foreground-muted">
                {MISSION_COPY.paragraphs.map((p) => (
                  <p key={p.slice(0, 20)}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works — compact */}
        <section className="border-b border-brand-border bg-brand-surface px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl min-w-0">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              How it works
            </p>
            <h2 className="mb-14 text-center text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              Three steps to a smarter search
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {SEEKER_STEPS.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <article
                    key={step.number}
                    className="group rounded-xl border border-brand-border bg-white p-6 transition-colors hover:border-brand-primary/40"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">
                        {step.number}
                      </span>
                      <Icon
                        className="h-5 w-5 text-brand-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="text-xl font-bold leading-snug tracking-tight text-brand-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl min-w-0">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
              What we stand for
            </p>
            <h2 className="mb-14 text-center text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
              The values that drive us.
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <article
                    key={value.title}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1",
                      TONE_BORDER[value.tone],
                      TONE_BG[value.tone],
                    )}
                  >
                    <span
                      className={cn(
                        "mb-5 flex h-10 w-10 items-center justify-center rounded-lg border",
                        value.tone === "primary"
                          ? "border-white/25 bg-white/10 text-white"
                          : value.tone === "surface"
                            ? "border-brand-primary/15 bg-white text-brand-primary"
                            : "border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3
                      className={cn(
                        "text-lg font-bold leading-snug tracking-tight",
                        TONE_TEXT[value.tone],
                      )}
                    >
                      {value.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-relaxed",
                        TONE_DESC[value.tone],
                      )}
                    >
                      {value.description}
                    </p>
                  </article>
                );
              })}
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
                  Start landing today
                </p>
                <h2 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-brand-foreground sm:text-5xl">
                  5 free AI resumes.
                  <br />
                  <span className="text-brand-primary">
                    Every month. No credit card.
                  </span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-brand-foreground-muted md:text-lg">
                  Five tailored, ATS-ready resumes every month — zero commitment.
                  Renews automatically.
                </p>

                <div className="mt-10 flex justify-center">
                  <Button asChild variant="primary" size="lg">
                    <Link href="/seeker/register">
                      Start Free
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
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
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
