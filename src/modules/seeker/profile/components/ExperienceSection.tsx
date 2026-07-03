import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";
import type { WorkExperienceItem } from "@/services/seeker.service";

interface ExperienceSectionProps {
  items: WorkExperienceItem[];
}

/*
 * formatDateRange
 * "MM/YYYY – MM/YYYY" or "MM/YYYY – Present" when isCurrent/endDate is null.
 */
function formatDateRange(startDate: string, endDate: string | null, isCurrent: boolean): string {
  return `${startDate} – ${isCurrent || !endDate ? "Present" : endDate}`;
}

/*
 * ExperienceSection
 * Read-only work-history card. `.map()`s WorkExperienceItem[] into entries.
 */
export function ExperienceSection({ items }: ExperienceSectionProps) {
  return (
    <ProfileSectionCard
      title="Experience"
      editHref="/settings#experience"
      isEmpty={items.length === 0}
      emptyLabel="No work experience added yet."
    >
      <div className="space-y-4">
        {items.map((entry) => (
          <div key={entry.id} className="space-y-1">
            <p className="text-sm font-semibold text-brand-foreground">
              {entry.title} · {entry.company}
            </p>
            <p className="text-xs text-brand-foreground-muted">
              {formatDateRange(entry.startDate, entry.endDate, entry.isCurrent)}
            </p>
            {entry.description && (
              <p className="text-sm text-brand-foreground-muted">{entry.description}</p>
            )}
            {entry.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entry.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-brand-border bg-brand-surface px-2 py-0.5 text-xs text-brand-foreground-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
