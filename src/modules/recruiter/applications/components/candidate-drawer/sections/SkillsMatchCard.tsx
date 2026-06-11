import { ThumbsUp } from "lucide-react";

interface SkillsMatchCardProps {
  matchedSkills: string[];
  missingSkills: string[];
  totalSkills: number;
  applicationId: string;
}

export function SkillsMatchCard({
  matchedSkills,
  missingSkills,
  applicationId,
}: SkillsMatchCardProps) {
  const allSkills = [
    ...matchedSkills.map((s) => ({ skill: s, matched: true })),
    ...missingSkills.map((s) => ({ skill: s, matched: false })),
  ];

  return (
    <section className="rounded-xl border border-brand-border bg-white p-4">
      <p className="text-sm font-bold text-brand-foreground">Skills Match</p>

      {allSkills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {allSkills.map(({ skill, matched }) =>
            matched ? (
              <span
                key={`match-${applicationId}-${skill}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-brand-foreground"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                {skill}
              </span>
            ) : (
              <span
                key={`missing-${applicationId}-${skill}`}
                className="inline-flex items-center rounded-full bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-foreground-muted"
              >
                {skill}
              </span>
            )
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-brand-foreground-muted">No required skills listed.</p>
      )}
    </section>
  );
}
