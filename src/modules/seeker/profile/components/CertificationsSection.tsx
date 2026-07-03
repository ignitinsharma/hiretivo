import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";
import type { CertificationItem } from "@/services/seeker.service";

interface CertificationsSectionProps {
  items: CertificationItem[];
}

/*
 * CertificationsSection
 * Read-only certifications card. `.map()`s CertificationItem[] into entries.
 */
export function CertificationsSection({ items }: CertificationsSectionProps) {
  return (
    <ProfileSectionCard
      title="Certifications"
      editHref="/settings#certifications"
      isEmpty={items.length === 0}
      emptyLabel="No certifications added yet."
    >
      <div className="space-y-3">
        {items.map((entry) => (
          <div key={entry.id} className="space-y-0.5">
            <p className="text-sm font-semibold text-brand-foreground">{entry.name}</p>
            {entry.issuer && <p className="text-xs text-brand-foreground-muted">{entry.issuer}</p>}
            {entry.issueDate && (
              <p className="text-xs text-brand-foreground-muted">
                {entry.issueDate}
                {entry.expiryDate ? ` – ${entry.expiryDate}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
