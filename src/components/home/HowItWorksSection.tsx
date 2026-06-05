/*
 * HowItWorksSection
 * Editorial 3-step recruiter journey section.
 * Desktop: grid-backed photo collage with rotated proof cards.
 * Mobile: stacked image and cards with stable, readable flow.
 * No props — fully static.
 */

import { LucideIcon, Search, Unlock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "primary" | "surface" | "white";
  positionClassName: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: Search,
    title: "Browse",
    description:
      "Filter by skills, salary, and timezone. Review verified profile context before any call. No resume noise.",
    tone: "primary",
    positionClassName:
      "lg:-left-32 lg:top-20 lg:w-[300px] lg:-rotate-3 xl:-left-40",
  },
  {
    number: "02",
    icon: Unlock,
    title: "Unlock",
    description:
      "One click reveals full name, email, GitHub, LinkedIn. No quota burned when engineers apply to you first.",
    tone: "surface",
    positionClassName:
      "lg:-right-6 lg:top-0 lg:w-[320px] lg:rotate-3 xl:-right-12",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Hire",
    description:
      "Schedule interview directly. Keep your shortlist focused on engineers with clear proof signals.",
    tone: "white",
    positionClassName:
      "lg:bottom-0 lg:-right-2 lg:w-[310px] lg:-rotate-2 xl:-right-6",
  },
];

const STEP_TONE_CLASSES: Record<Step["tone"], string> = {
  primary: "border-brand-primary/25 bg-brand-primary text-white",
  surface: "border-brand-primary/20 bg-brand-surface text-brand-foreground",
  white: "border-brand-border bg-white text-brand-foreground",
};

const STEP_NUMBER_CLASSES: Record<Step["tone"], string> = {
  primary: "border-white/25 bg-white text-brand-primary",
  surface: "border-brand-primary/20 bg-brand-primary text-white",
  white: "border-brand-border bg-brand-foreground text-white",
};

const STEP_DESCRIPTION_CLASSES: Record<Step["tone"], string> = {
  primary: "text-white/85",
  surface: "text-brand-foreground-muted",
  white: "text-brand-foreground-muted",
};

const STEP_ICON_CLASSES: Record<Step["tone"], string> = {
  primary: "border-white/25 bg-white/10 text-white",
  surface: "border-brand-primary/15 bg-white text-brand-primary",
  white: "border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary",
};

const TEAM_IMAGE_SRC =
  "https://cdn.pixabay.com/photo/2026/04/13/06/42/tylijura-team-10224247_1280.jpg";

/*
 * StepNote
 * Renders one responsive note card around the hiring-team image.
 * @param step - Static recruiter journey step to render
 */
function StepNote({ step }: { step: Step }) {
  const { number, icon: Icon, title, description, tone, positionClassName } = step;

  return (
    <article
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-xl border p-5 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none lg:absolute lg:z-20 lg:p-6",
        STEP_TONE_CLASSES[tone],
        positionClassName,
      )}
    >
      <div className="mb-7 flex items-center justify-between gap-4 transition-transform duration-500 [transform:translateZ(24px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
            STEP_NUMBER_CLASSES[tone],
          )}
        >
          {number}
        </span>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            STEP_ICON_CLASSES[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <h3 className="break-words text-xl font-bold leading-tight tracking-tight transition-transform duration-500 [transform:translateZ(22px)] group-hover:[transform:translate3d(0,-1px,32px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">{title}</h3>
      <p className={cn("mt-2 break-words text-sm leading-relaxed transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-1px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none", STEP_DESCRIPTION_CLASSES[tone])}>
        {description}
      </p>
    </article>
  );
}

/*
 * HowItWorksSection
 * Renders the 3-step recruiter journey as a grid-backed photo collage.
 */
export function HowItWorksSection() {
  return (
    <section className="grid-bg border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl min-w-0">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl min-w-0 text-center md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            How it works
          </p>
          <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            From browse to hire in 3 steps
          </h2>
        </div>

        <div className="relative min-w-0">
          <div className="relative mx-auto max-w-4xl min-w-0 lg:min-h-[610px]">
            <div className="relative mx-auto overflow-hidden rounded-xl border border-brand-border bg-white lg:absolute lg:left-1/2 lg:top-24 lg:w-[620px] lg:-translate-x-1/2">
              <div className="border-b border-brand-border bg-white px-5 py-3">
                <span className="block h-2 w-20 rounded-lg bg-brand-surface" aria-hidden="true" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Remote hiring team reviewing candidates together"
                className="aspect-[1.38] w-full object-cover lg:h-[380px]"
                loading="lazy"
                src={TEAM_IMAGE_SRC}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:block">
              {STEPS.map((step) => (
                <StepNote key={step.number} step={step} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
