/*
 * HowItWorksSection
 * Editorial 3-step seeker journey section.
 * Desktop: grid-backed photo collage with rotated proof cards.
 * Mobile: stacked with stable, readable flow.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, FileText, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEEKER_STEPS } from "@/config/home-page";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  positionClassName: string;
}

/*
 * Step photos shown in the center frame — one per step (browse, generate, offer).
 * Free-license Unsplash photos stored locally in /public/images/people.
 */
const STEP_PHOTOS = [
  { src: "/images/people/browse.jpg", alt: "Job seeker browsing roles on a laptop" },
  { src: "/images/people/resume.jpg", alt: "Job seeker writing a tailored resume" },
  { src: "/images/people/offer.jpg", alt: "Handshake after a successful job offer" },
] as const;

const STEPS: Step[] = [
  {
    number: "01",
    icon: Search,
    title: SEEKER_STEPS[0].title,
    description: SEEKER_STEPS[0].description,
    positionClassName: "lg:-left-32 lg:top-20 lg:w-[300px] lg:-rotate-3 xl:-left-40",
  },
  {
    number: "02",
    icon: FileText,
    title: SEEKER_STEPS[1].title,
    description: SEEKER_STEPS[1].description,
    positionClassName: "lg:-right-24 lg:top-0 lg:w-[320px] lg:rotate-3 xl:-right-40",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: SEEKER_STEPS[2].title,
    description: SEEKER_STEPS[2].description,
    positionClassName: "lg:-bottom-6 lg:-right-16 lg:w-[310px] lg:-rotate-2 xl:-right-36",
  },
];

/*
 * StepNote
 * Renders one responsive note card around the dashboard image.
 */
function StepNote({ step, index }: { step: Step; index: number }) {
  const { number, icon: Icon, title, description, positionClassName } = step;
  const tones = ["primary", "surface", "white"] as const;
  const tone = tones[index];

  const toneClasses = {
    primary: "border-brand-primary/25 bg-brand-primary text-white",
    surface: "border-brand-primary/20 bg-brand-surface text-brand-foreground",
    white: "border-brand-border bg-white text-brand-foreground",
  };

  const numberClasses = {
    primary: "border-white/25 bg-white text-brand-primary",
    surface: "border-brand-primary/20 bg-brand-primary text-white",
    white: "border-brand-border bg-brand-foreground text-white",
  };

  const descriptionClasses = {
    primary: "text-white/85",
    surface: "text-brand-foreground-muted",
    white: "text-brand-foreground-muted",
  };

  const iconClasses = {
    primary: "border-white/25 bg-white/10 text-white",
    surface: "border-brand-primary/15 bg-white text-brand-primary",
    white: "border-brand-primary/15 bg-brand-primary/[0.06] text-brand-primary",
  };

  return (
    <article
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-xl border p-5 transition-all duration-500 ease-out [perspective:1000px] [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none lg:absolute lg:z-20 lg:p-6",
        toneClasses[tone],
        positionClassName,
      )}
    >
      <div className="mb-7 flex items-center justify-between gap-4 transition-transform duration-500 [transform:translateZ(24px)] group-hover:[transform:translate3d(0,-2px,34px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
            numberClasses[tone],
          )}
        >
          {number}
        </span>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            iconClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <h3 className="break-words text-xl font-bold leading-tight tracking-tight transition-transform duration-500 [transform:translateZ(22px)] group-hover:[transform:translate3d(0,-1px,32px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 break-words text-sm leading-relaxed transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,-1px,28px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none",
          descriptionClasses[tone],
        )}
      >
        {description}
      </p>
    </article>
  );
}

/*
 * HowItWorksSection
 * Renders the 3-step seeker journey as a grid-backed card collage.
 */
export function HowItWorksSection() {
  return (
    <section className="grid-bg border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="mx-auto mb-12 max-w-2xl min-w-0 text-center md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            How it works
          </p>
          <h2 className="break-words text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            From browse to offer in 3 steps
          </h2>
          <Link
            href="/how-it-works"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-dark"
          >
            See the full walkthrough
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative min-w-0">
          <div className="relative mx-auto max-w-4xl min-w-0 lg:min-h-[610px]">
            <div className="relative mx-auto overflow-hidden rounded-xl border border-brand-border bg-white lg:absolute lg:left-1/2 lg:top-24 lg:w-[620px] lg:-translate-x-1/2">
              <div className="border-b border-brand-border bg-white px-5 py-3">
                <span className="block h-2 w-20 rounded-lg bg-brand-surface" aria-hidden="true" />
              </div>
              <div className="grid aspect-[1.38] w-full grid-cols-3 divide-x divide-white/60 lg:h-[380px]">
                {STEP_PHOTOS.map((photo, index) => (
                  <div key={photo.src} className="relative overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 1024px) 33vw, 210px"
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                      {STEPS[index].number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:block">
              {STEPS.map((step, index) => (
                <StepNote key={step.number} step={step} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
