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
import type { ApplicationDetail, SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

interface StepSubmitProps {
  application: ApplicationDetail;
  resume: ResumeDocument;
  coverLetter: string;
  onFinalized: (tailoredResumeUrl: string, submittedFormData: SubmittedFormField[]) => void;
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

  const rows: SubmittedFormField[] = useMemo(() => {
    const s = settings?.data;
    const d = defaultsData?.data;
    return [
      { fieldKey: "fullName", label: "Full name", value: s?.name ?? "" },
      { fieldKey: "email", label: "Email", value: s?.email ?? "" },
      { fieldKey: "phone", label: "Phone", value: d?.phone ?? "" },
      { fieldKey: "addressLine", label: "Address", value: d?.addressLine ?? "" },
      { fieldKey: "city", label: "City", value: d?.city ?? "" },
      { fieldKey: "state", label: "State", value: d?.state ?? "" },
      { fieldKey: "postalCode", label: "Postal code", value: d?.postalCode ?? "" },
      { fieldKey: "linkedinUrl", label: "LinkedIn", value: d?.linkedinUrl ?? "" },
      { fieldKey: "workAuth", label: "Work authorization", value: d?.workAuth ?? "" },
      { fieldKey: "needsSponsorship", label: "Needs sponsorship", value: d?.needsSponsorship ? "Yes" : "No" },
    ];
  }, [settings, defaultsData]);

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

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-brand-foreground-muted">
        Open the job on {application.companyName}&apos;s site and submit your application there —
        we don&apos;t submit it for you. Use the cheatsheet below to fill in any ATS fields quickly.
      </p>

      <CheatsheetPanel rows={rows} />

      {application.applyUrl && (
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

      {error && <p className="text-sm text-brand-danger">{error}</p>}

      <Button variant="primary" size="sm" className="self-start" onClick={handleFinalize} disabled={isFinalizing}>
        {isFinalizing ? "Recording..." : "I submitted my application"}
      </Button>
    </div>
  );
}
