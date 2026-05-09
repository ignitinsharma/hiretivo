import { Calendar, GraduationCap } from "lucide-react";

import type { CandidateEducation } from "../types";

interface TabContentEducationProps {
  educations?: CandidateEducation[];
}

export function TabContentEducation({ educations }: TabContentEducationProps) {
  if (!educations?.length) {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-brand-foreground-secondary" />
        <p className="mt-3 text-sm text-brand-foreground-muted">No education provided.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {educations.map((education) => (
        <article key={education.id} className="rounded-xl border border-brand-border bg-white p-5">
          <p className="text-base font-semibold text-brand-foreground">{education.institution}</p>
          {education.degree || education.major ? (
            <p className="mt-1 text-sm font-medium text-brand-primary">
              {[education.degree, education.major].filter(Boolean).join(" - ")}
            </p>
          ) : null}
          {education.graduationDate ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-brand-foreground-secondary">
              <Calendar className="h-3 w-3" />
              Graduated {education.graduationDate}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
