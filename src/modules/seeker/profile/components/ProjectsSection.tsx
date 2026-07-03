import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";
import type { ProjectInput } from "@/lib/validations/project.schema";

interface ProjectsSectionProps {
  items: ProjectInput[];
}

const HTTP_URL_REGEX = /^https?:\/\//i;

/*
 * getSafeProjectUrl
 * Render-site defense in depth: only http(s) URLs become an anchor href,
 * even though the schema already rejects javascript:/data: at save time.
 */
function getSafeProjectUrl(url: string | null | undefined): string | null {
  return url && HTTP_URL_REGEX.test(url) ? url : null;
}

/*
 * ProjectsSection
 * Read-only projects card. `.map()`s ProjectInput[] into entries.
 */
export function ProjectsSection({ items }: ProjectsSectionProps) {
  return (
    <ProfileSectionCard
      title="Projects"
      editHref="/settings#projects"
      isEmpty={items.length === 0}
      emptyLabel="No projects added yet."
    >
      <div className="space-y-4">
        {items.map((entry, index) => {
          const safeUrl = getSafeProjectUrl(entry.url);
          return (
          <div key={`${entry.title}-${index}`} className="space-y-1">
            <p className="text-sm font-semibold text-brand-foreground">
              {safeUrl ? (
                <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                  {entry.title}
                </a>
              ) : (
                entry.title
              )}
            </p>
            {entry.description && <p className="text-sm text-brand-foreground-muted">{entry.description}</p>}
            {entry.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entry.skills.map((skill) => (
                  <span key={skill} className="rounded-lg border border-brand-border bg-brand-surface px-2 py-0.5 text-xs text-brand-foreground-muted">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </ProfileSectionCard>
  );
}
