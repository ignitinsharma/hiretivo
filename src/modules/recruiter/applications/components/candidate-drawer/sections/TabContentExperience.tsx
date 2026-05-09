import { Briefcase, Calendar } from "lucide-react";

import type { CandidateWorkExperience } from "../types";
import { formatDateRange } from "../utils";

interface TabContentExperienceProps {
  experiences?: CandidateWorkExperience[];
}

export function TabContentExperience({ experiences }: TabContentExperienceProps) {
  if (!experiences?.length) {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-brand-foreground-secondary" />
        <p className="mt-3 text-sm text-brand-foreground-muted">No work experience provided.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiences.map((experience) => (
        <article key={experience.id} className="rounded-xl border border-brand-border bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-brand-foreground">{experience.title}</p>
              <p className="text-sm font-medium text-brand-primary">{experience.company}</p>
            </div>
            {experience.isCurrent ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Current
              </span>
            ) : null}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-brand-foreground-secondary">
            <Calendar className="h-3 w-3" />
            {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
          </p>
          {experience.description ? (
            <p className="mt-3 text-sm leading-relaxed text-brand-foreground-muted">{experience.description}</p>
          ) : null}
          {experience.skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {experience.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-foreground-muted">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
