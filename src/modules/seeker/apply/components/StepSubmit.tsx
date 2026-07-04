"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { seekerService } from "@/services/seeker.service";
import type { SeekerSettingsData } from "@/services/seeker.service";
import type { ApplicationDefaultsInput } from "@/lib/validations/application-defaults.schema";
import { CheatsheetPanel } from "@/modules/seeker/apply/components/CheatsheetPanel";
import { formatResumeAsText } from "@/modules/seeker/apply/utils/format-resume-text";
import { buildSubmittedFormRows } from "@/modules/seeker/apply/utils/build-submitted-form-rows";
import { ApplySubmitLayout } from "@/constants/enums";
import type { ApplicationDetail, SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

interface StepSubmitProps {
  application: ApplicationDetail;
  resume: ResumeDocument;
  coverLetter: string;
  onFinalized: (tailoredResumeUrl: string | null, submittedFormData: SubmittedFormField[]) => void;
}

/*
 * StepSubmit
 * Assisted submit: shows the copy-paste ATS-form cheatsheet, opens the
 * source ATS in a new tab, and on confirm renders the resume to PDF and
 * records the submission (finalize). No automation submits on the seeker's
 * behalf — the copy is explicit that they do it themselves on the ATS.
 */
export function StepSubmit({ application, resume, coverLetter, onFinalized }: StepSubmitProps) {
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<ApplySubmitLayout>(ApplySubmitLayout.SIMPLE);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const resumeText = useMemo(() => formatResumeAsText(resume), [resume]);

  const { data: settings, isLoading: settingsLoading } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });
  const { data: defaultsData, isLoading: defaultsLoading } = useQuery<{
    data: ApplicationDefaultsInput | null;
  }>({
    queryKey: ["seeker-application-defaults"],
    queryFn: seekerService.getApplicationDefaults,
    staleTime: 60_000,
  });

  const rows: SubmittedFormField[] = useMemo(
    () => buildSubmittedFormRows(settings?.data, defaultsData?.data),
    [settings, defaultsData],
  );

  const handleFinalize = async () => {
    setIsFinalizing(true);
    setError(null);
    try {
      const { data } = await seekerService.finalizeApplication(application.id, {
        resume,
        coverLetter,
        submittedFormData: rows,
      });
      onFinalized(data.tailoredResumeUrl, rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record your application. Try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (settingsLoading || defaultsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const isSplit = layout === ApplySubmitLayout.SPLIT && Boolean(application.applyUrl);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-foreground-muted">
        Open the job on {application.companyName}&apos;s site and submit your application there —
        we don&apos;t submit it for you. Use the cheatsheet below to fill in any ATS fields quickly.
      </p>

      {application.applyUrl && (
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
            View
          </span>
          <div className="inline-flex rounded-lg border border-brand-border p-0.5">
            <button
              type="button"
              onClick={() => setLayout(ApplySubmitLayout.SIMPLE)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                layout === ApplySubmitLayout.SIMPLE
                  ? "bg-brand-primary text-white"
                  : "text-brand-foreground-muted hover:text-brand-foreground"
              }`}
            >
              Simple view
            </button>
            <button
              type="button"
              onClick={() => setLayout(ApplySubmitLayout.SPLIT)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                layout === ApplySubmitLayout.SPLIT
                  ? "bg-brand-primary text-white"
                  : "text-brand-foreground-muted hover:text-brand-foreground"
              }`}
            >
              Split view
            </button>
          </div>
        </div>
      )}

      <div className={`flex flex-col gap-6 ${isSplit ? "lg:flex-row lg:items-start" : ""}`}>
        <div className={`flex flex-col gap-4 ${isSplit ? "lg:w-1/2" : ""}`}>
          <CheatsheetPanel rows={rows} resumeText={resumeText} coverLetterText={coverLetter} />

          {application.applyUrl && !isSplit && (
            <a
              href={application.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
            >
              Open job application
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {isSplit && (
          <div className="hidden flex-col gap-2 lg:flex lg:w-1/2">
            {iframeBlocked ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-surface p-8 text-center">
                <p className="text-sm text-brand-foreground-muted">This site can&apos;t be embedded.</p>
                <a
                  href={application.applyUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  Open it in a new tab
                </a>
              </div>
            ) : (
              // Note: browsers that refuse to embed a page for X-Frame-Options/CSP
              // load an in-frame error page without firing onError, so this handler
              // only catches network-level failures. The always-visible "open in
              // new tab" link below is the real fallback for the silent-block case.
              <iframe
                src={application.applyUrl ?? undefined}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                className="h-[600px] w-full rounded-lg border border-brand-border"
                onError={() => setIframeBlocked(true)}
                title="ATS application"
              />
            )}
            <a
              href={application.applyUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-brand-primary hover:underline"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-brand-danger">{error}</p>}

      <Button variant="primary" size="sm" className="self-start" onClick={handleFinalize} disabled={isFinalizing}>
        {isFinalizing ? "Recording..." : "I submitted my application"}
      </Button>
    </div>
  );
}
