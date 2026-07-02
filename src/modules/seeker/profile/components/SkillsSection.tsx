import { ProfileSectionCard } from "@/modules/seeker/profile/components/ProfileSectionCard";

interface SkillsSectionProps {
  skills: { id: string; name: string; slug: string }[];
}

/*
 * SkillsSection
 * Read-only skills card. `.map()`s skills into chips.
 */
export function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <ProfileSectionCard
      title="Skills"
      editHref="/settings"
      isEmpty={skills.length === 0}
      emptyLabel="No skills added yet."
    >
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1 text-sm text-brand-foreground"
          >
            {skill.name}
          </span>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
