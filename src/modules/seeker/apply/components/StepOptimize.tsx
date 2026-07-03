"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizeMode } from "@/constants/enums";
import { computeKeywordStats } from "@/lib/apply/keyword-match";
import { seekerService } from "@/services/seeker.service";
import type { CertificationItem, SeekerSettingsData } from "@/services/seeker.service";
import type { ProjectInput } from "@/lib/validations/project.schema";
import { buildApplyAiProfile } from "@/modules/seeker/apply/utils/build-apply-profile";
import { ResumeEditor } from "@/modules/seeker/apply/components/ResumeEditor";
import type { ApplicationDetail } from "@/modules/seeker/apply/types/apply.types";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

interface StepOptimizeProps {
  application: ApplicationDetail;
  resume: ResumeDocument | null;
  onOptimized: (resume: ResumeDocument, reservationHandle: string | null) => void;
  onResumeChange: (resume: ResumeDocument) => void;
  onNext: () => void;
}

/*
 * StepOptimize
 * Generates a JD-tailored resume via the Phase-4 optimize-resume route using
 * the seeker's real profile data, then lets them edit it before advancing.
 * A failed generation never burns a credit (Phase-4 refund contract) — this
 * step just surfaces the error and offers retry.
 */
export function StepOptimize({ application, resume, onOptimized, onResumeChange, onNext }: StepOptimizeProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });
  const { data: certData } = useQuery<{ data: { certifications: CertificationItem[] } }>({
    queryKey: ["seeker-certifications"],
    queryFn: seekerService.getCertifications,
    staleTime: 60_000,
  });
  const { data: projectsData } = useQuery<{ data: { projects: ProjectInput[] } }>({
    queryKey: ["seeker-projects"],
    queryFn: seekerService.getProjects,
    staleTime: 60_000,
  });
  const { data: optimizeModeData } = useQuery<{ data: { optimizeMode: OptimizeMode } }>({
    queryKey: ["seeker-optimize-mode"],
    queryFn: seekerService.getOptimizeMode,
    staleTime: 60_000,
  });

  const keywordPreview = useMemo(() => {
    if (!settings) return null;
    const seekerSkillNames = settings.data.skills.map((s) => s.name);
    return computeKeywordStats(application.requiredSkills, application.preferredSkills, seekerSkillNames).stats;
  }, [settings, application.requiredSkills, application.preferredSkills]);

  const handleGenerate = async () => {
    if (!settings) return;
    setIsGenerating(true);
    setError(null);
    try {
      const profile = buildApplyAiProfile(
        settings.data,
        certData?.data.certifications ?? [],
        projectsData?.data.projects ?? [],
      );
      const { resume: doc, reservationHandle } = await seekerService.optimizeResume({
        jobId: application.jobId ?? undefined,
        jdText: application.jobId ? undefined : application.jdText,
        requiredSkills: application.requiredSkills,
        preferredSkills: application.preferredSkills,
        jobTitle: application.jobTitle,
        company: application.companyName,
        tone: optimizeModeData?.data.optimizeMode ?? OptimizeMode.HONEST,
        profile,
      });
      onOptimized(doc, reservationHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Your credit was not used.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (resume) {
    return (
      <div className="flex flex-col gap-6">
        <ResumeEditor resume={resume} onChange={onResumeChange} />
        <Button variant="primary" size="sm" className="self-start" onClick={onNext}>
          Continue
        </Button>
      </div>
    );
  }

  if (settingsLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-brand-foreground-muted">
        We&apos;ll tailor your resume to this job&apos;s required skills using your real profile data —
        nothing is fabricated.
      </p>
      {keywordPreview && (
        <p className="text-sm text-brand-foreground">
          You match {keywordPreview.requiredMatched} of {application.requiredSkills.length} required skills.
        </p>
      )}
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      <Button variant="primary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Optimize resume"}
      </Button>
    </div>
  );
}
