"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizeMode } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";
import type { CertificationItem, SeekerSettingsData } from "@/services/seeker.service";
import type { ProjectInput } from "@/lib/validations/project.schema";
import { buildApplyAiProfile } from "@/modules/seeker/apply/utils/build-apply-profile";
import { useCredits, SEEKER_CREDITS_QUERY_KEY } from "@/hooks/use-credits";
import { useUIStore } from "@/store/use-ui-store";
import type { ApplicationDetail } from "@/modules/seeker/apply/types/apply.types";

interface StepCoverProps {
  application: ApplicationDetail;
  coverLetter: string;
  reservationHandle: string | null;
  onGenerated: (coverLetter: string) => void;
  onReservationConsumed: () => void;
  onNext: () => void;
}

/*
 * StepCover
 * Generates a JD-specific cover letter via the Phase-4 cover-letter route.
 * The first call redeems the optimize step's reservation handle (one
 * wizard-run credit covers both artifacts); once that handle is consumed
 * it's gone server-side (single-use GETDEL) — a "Regenerate" after that
 * point reserves and consumes its own credit, same as generating fresh.
 * Never sends a client-asserted "already paid" flag (the exact bypass
 * Phase 4's security fix closed).
 */
export function StepCover({
  application,
  coverLetter,
  reservationHandle,
  onGenerated,
  onReservationConsumed,
  onNext,
}: StepCoverProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const openPaidFeatureModal = useUIStore((s) => s.openPaidFeatureModal);
  // Only "Regenerate" spends a fresh credit — the first generate redeems the
  // optimize step's already-reserved handle, so it's never gated here.
  const { data: creditsData } = useCredits();
  const isOutOfCredits = coverLetter ? (creditsData ? creditsData.data.remaining <= 0 : false) : false;

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

  const handleGenerate = async () => {
    if (!settings) return;
    if (isOutOfCredits) {
      openPaidFeatureModal({
        feature: "ai_credits",
        title: "Out of AI credits this month",
        description: "Regenerating a cover letter spends another credit. Upgrade to Pro or Max for more.",
      });
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const profile = buildApplyAiProfile(
        settings.data,
        certData?.data.certifications ?? [],
        projectsData?.data.projects ?? [],
      );
      const { coverLetter: text } = await seekerService.generateCoverLetter({
        jobId: application.jobId ?? undefined,
        jdText: application.jobId ? undefined : application.jdText,
        requiredSkills: application.requiredSkills,
        preferredSkills: application.preferredSkills,
        jobTitle: application.jobTitle,
        company: application.companyName,
        tone: optimizeModeData?.data.optimizeMode ?? OptimizeMode.HONEST,
        profile,
        reservationHandle: reservationHandle ?? undefined,
      });
      onGenerated(text);
      onReservationConsumed();
      if (!reservationHandle) {
        queryClient.invalidateQueries({ queryKey: SEEKER_CREDITS_QUERY_KEY });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Your credit was not used.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvance = async () => {
    await seekerService.updateApplication(application.id, { coverLetter }).catch(() => {});
    onNext();
  };

  if (settingsLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!coverLetter) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-brand-foreground-muted">
          We&apos;ll write a short cover letter specific to this job, using your real experience.
        </p>
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        <Button variant="primary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate cover letter"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Textarea value={coverLetter} onChange={(e) => onGenerated(e.target.value)} rows={12} />
      <p className="text-xs text-brand-foreground-secondary">{coverLetter.length} characters</p>
      {error && <p className="text-sm text-brand-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Regenerating..." : "Regenerate (uses another credit)"}
        </Button>
        <Button variant="primary" size="sm" onClick={handleAdvance}>
          Continue
        </Button>
      </div>
    </div>
  );
}
