import { CheckCircle2, TrendingUp } from "lucide-react";

interface SkillsMatchCardProps {
  matchedSkills: string[];
  missingSkills: string[];
  totalSkills: number;
  applicationId: string;
}

export function SkillsMatchCard({
  matchedSkills,
  missingSkills,
  totalSkills,
  applicationId,
}: SkillsMatchCardProps) {
  const percent = totalSkills > 0 ? (matchedSkills.length / totalSkills) * 100 : 0;

  return (
    <section className="rounded-xl border border-brand-border bg-white">
      <header className="flex items-center justify-between border-b border-brand-border px-5 py-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-foreground">
          <TrendingUp className="h-4 w-4 text-brand-primary" />
          Skills Match
        </p>
        <span className="text-xs font-medium text-brand-foreground-muted">
          {matchedSkills.length} of {totalSkills}
        </span>
      </header>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-success">Matched Skills</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-surface">
            <div className="h-full rounded-full bg-brand-success" style={{ width: `${percent}%` }} />
          </div>
          {matchedSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <span
                  key={`match-${applicationId}-${skill}`}
                  className="rounded bg-brand-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-brand-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-brand-foreground-muted">No matched skills yet.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Missing Skills</p>
          {missingSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {missingSkills.map((skill) => (
                <span
                  key={`missing-${applicationId}-${skill}`}
                  className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-success">
              <CheckCircle2 className="h-4 w-4" />
              All required skills matched!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
