/*
 * TestimonialsSection
 * Social proof section — 3 hiring manager testimonials with quote, name, title, stars.
 * Cards use subtle CSS-only 3D hover while preserving reduced-motion behavior.
 * Displayed below the WhyVerified comparison table.
 * Fully static — no props, no data fetching.
 */

import { TESTIMONIALS } from '@/config/home-page'
import type { Testimonial } from '@/config/home-page'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'

/*
 * StarRating
 * Renders N filled star glyphs for testimonial ratings.
 * @param count - number of stars (1–5)
 */
function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="text-sm text-brand-primary" aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  )
}

/*
 * TestimonialCard
 * Single testimonial card with large quote mark, text, avatar, name, title, stars.
 * @param testimonial - Testimonial data object
 */
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="group [perspective:1000px]">
      <article className="relative flex min-h-[310px] flex-col gap-4 rounded-xl border border-brand-border bg-white p-6 transition-all duration-500 ease-out [transform-style:preserve-3d] hover:-translate-y-1 hover:border-brand-primary/40 hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:transform-none">
        <div
          className="pointer-events-none absolute inset-x-4 top-4 h-16 rounded-lg border border-brand-border bg-brand-surface transition-transform duration-500 group-hover:[transform:translate3d(0,-3px,18px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
          aria-hidden="true"
        />

        {/* Quote mark */}
        <span
          className="relative z-10 select-none text-5xl font-bold leading-none text-brand-primary/35 transition-transform duration-500 [transform:translateZ(28px)] group-hover:[transform:translate3d(0,-2px,36px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
          aria-hidden="true"
        >
          &ldquo;
        </span>

        {/* Quote text */}
        <p className="relative z-10 -mt-3 flex-1 text-[13px] leading-[1.85] text-brand-foreground transition-transform duration-500 [transform:translateZ(22px)] group-hover:[transform:translate3d(0,-1px,30px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
          {testimonial.quote}
        </p>

        {/* Footer: avatar + name/title + stars */}
        <div className="relative z-10 flex items-center gap-3 border-t border-brand-border pt-4 transition-transform duration-500 [transform:translateZ(18px)] group-hover:[transform:translate3d(0,0,26px)] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
          <InitialsAvatar
            name={testimonial.name}
            userId={testimonial.id}
            fallbackSeed={testimonial.initials}
            image={testimonial.image}
            size="md"
            className="h-9 w-9 shrink-0 bg-brand-surface"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-foreground">
              {testimonial.name}
            </p>
            <p className="truncate text-xs text-brand-foreground-muted">
              {testimonial.title}
            </p>
          </div>
          <StarRating count={testimonial.stars} />
        </div>
      </article>
    </div>
  );
}

/*
 * TestimonialsSection
 * Renders the "Hiring teams love Hiretivo" section with label, heading, and 3 cards.
 * @returns JSX section element — fully static
 */
export function TestimonialsSection() {
  return (
    <section className="grid-bg border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ── */}
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-brand-primary">
            Trusted by Remote-First Teams
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-5xl">
            Hiring teams love Hiretivo
          </h2>
        </div>

        {/* ── Testimonial cards ── */}
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
