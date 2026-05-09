import type { CandidateApplication } from "../types";

interface TabContentSummaryProps {
  application: CandidateApplication;
}

export function TabContentSummary({ application }: TabContentSummaryProps) {
  const profile = application.candidateProfile;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-border bg-white p-5">
        <p className="text-sm font-semibold text-brand-foreground">Skills</p>
        {profile?.skills?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={`${application.id}-${skill}`}
                className="rounded bg-brand-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-brand-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-brand-foreground-muted">No skills provided.</p>
        )}
      </section>

      <section className="rounded-xl border border-brand-border bg-white p-5">
        <p className="text-sm font-semibold text-brand-foreground">Cover Letter</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-foreground-muted">
          {application.coverLetter?.trim() || "No cover letter provided."}
        </p>
      </section>
    </div>
  );
}
