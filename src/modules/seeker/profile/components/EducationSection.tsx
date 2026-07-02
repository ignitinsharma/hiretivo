import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";
import type { EducationItem } from "@/services/seeker.service";

interface EducationSectionProps {
  items: EducationItem[];
}

/*
 * EducationSection
 * Read-only education card. `.map()`s EducationItem[] into entries.
 */
export function EducationSection({ items }: EducationSectionProps) {
  return (
    <ProfileSectionCard
      title="Education"
      editHref="/settings#education"
      isEmpty={items.length === 0}
      emptyLabel="No education added yet."
    >
      <div className="space-y-3">
        {items.map((entry) => (
          <div key={entry.institution + (entry.graduationDate ?? "")} className="space-y-0.5">
            <p className="text-sm font-semibold text-brand-foreground">{entry.institution}</p>
            <p className="text-xs text-brand-foreground-muted">
              {[entry.degree, entry.major].filter(Boolean).join(", ")}
              {entry.graduationDate ? ` · ${entry.graduationDate}` : ""}
            </p>
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
