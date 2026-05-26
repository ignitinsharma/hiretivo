/*
 * SeekerSkillsCard
 * Displays skills as color-coded badge bubbles by proficiency level.
 * Returns null when no skills are submitted.
 */

interface SkillItem {
  level: string;
  skill: { name: string };
}

interface SeekerSkillsCardProps {
  skills: SkillItem[] | null | undefined;
}

const SKILL_LEVEL_STYLES: Record<string, string> = {
  expert: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  intermediate: "bg-blue-50 text-blue-700 border-blue-200",
  beginner: "bg-gray-50 text-gray-600 border-gray-200",
};

export function SeekerSkillsCard({ skills }: SeekerSkillsCardProps) {
  if (!skills?.length) return null;

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 font-semibold text-base leading-snug tracking-tight text-brand-foreground">
        Skills
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((entry) => {
          const level = entry.level?.toLowerCase() ?? "beginner";
          const levelStyle =
            SKILL_LEVEL_STYLES[level] ?? SKILL_LEVEL_STYLES.beginner;
          return (
            <span
              key={`${entry.skill.name}-${entry.level}`}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${levelStyle}`}
            >
              {entry.skill.name}
              <span className="ml-1.5 opacity-60">{entry.level}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
