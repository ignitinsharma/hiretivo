/*
 * SeekerBioCard
 * Displays the seeker's bio in a card. Returns null when no bio is provided.
 */

interface SeekerBioCardProps {
  bio: string | null | undefined;
}

export function SeekerBioCard({ bio }: SeekerBioCardProps) {
  if (!bio?.trim()) return null;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        Bio
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-foreground-muted">
        {bio}
      </p>
    </section>
  );
}
