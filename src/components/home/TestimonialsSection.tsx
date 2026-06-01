/*
 * TestimonialsSection
 * Social proof section — 3 hiring manager testimonials with quote, name, title, stars.
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
        <span key={i} className="text-amber-400 text-sm" aria-hidden="true">
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
    <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-white p-6 transition-colors hover:border-brand-primary/40">
      {/* Quote mark */}
      <span className="font-display text-5xl font-bold leading-none text-brand-primary/20 select-none" aria-hidden="true">
        &ldquo;
      </span>

      {/* Quote text */}
      <p className="font-body flex-1 text-[13px] leading-[1.85] text-brand-foreground -mt-3">
        {testimonial.quote}
      </p>

      {/* Footer: avatar + name/title + stars */}
      <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
        <InitialsAvatar
          name={testimonial.name}
          userId={testimonial.id}
          fallbackSeed={testimonial.initials}
          image={testimonial.image}
          size="md"
          className="h-9 w-9 shrink-0 bg-brand-surface"
        />
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold text-brand-foreground truncate">{testimonial.name}</p>
          <p className="font-body text-xs text-brand-foreground-muted truncate">{testimonial.title}</p>
        </div>
        <StarRating count={testimonial.stars} />
      </div>
    </div>
  )
}

/*
 * TestimonialsSection
 * Renders the "Hiring teams love Hiretivo" section with label, heading, and 3 cards.
 * @returns JSX section element — fully static
 */
export function TestimonialsSection() {
  return (
    <section className="border-b border-brand-border bg-white px-4 py-20 md:px-8 md:py-24">
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
