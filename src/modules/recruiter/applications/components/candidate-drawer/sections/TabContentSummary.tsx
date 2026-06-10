import type { CandidateApplication } from "../types";

interface TabContentSummaryProps {
  application: CandidateApplication;
}

export function TabContentSummary({ application }: TabContentSummaryProps) {
  const profile = application.candidateProfile;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-border bg-white p-5">
        <p className="text-sm font-semibold text-brand-foreground">Cover Letter</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-foreground-muted">
          {application.coverLetter?.trim() || "No cover letter provided."}
        </p>
      </section>
    </div>
  );
}
