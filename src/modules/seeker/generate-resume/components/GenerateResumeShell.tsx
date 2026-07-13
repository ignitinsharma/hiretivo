"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizeMode } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";
import type { CertificationItem, SeekerSettingsData } from "@/services/seeker.service";
import type { ProjectInput } from "@/lib/validations/project.schema";
import type { MatchAnalysis, CoverLetterOutput } from "@/lib/ai-prompts";
import { buildApplyAiProfile } from "@/modules/seeker/apply/utils/build-apply-profile";
import { ResumePreview } from "@/modules/seeker/apply/components/ResumePreview";
import { JdInputPanel } from "@/modules/seeker/generate-resume/components/JdInputPanel";
import { MatchAnalysisPanel } from "@/modules/seeker/generate-resume/components/MatchAnalysisPanel";
import { CoverLetterPanel } from "@/modules/seeker/generate-resume/components/CoverLetterPanel";
import { useCredits, SEEKER_CREDITS_QUERY_KEY } from "@/hooks/use-credits";
import { useUIStore } from "@/store/use-ui-store";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

interface JdInput {
  jdText: string;
  jobTitle: string;
  company: string;
}

/*
 * GenerateResumeShell
 * Orchestrates the standalone resume-tailoring flow. Side-by-side layout: left
 * panel for JD input + match analysis + cover letter, right panel shows a
 * realistic resume preview. Generation is explicit — the user must click
 * "Generate resume" to start; nothing auto-generates.
 */
export function GenerateResumeShell() {
  const [jdInput, setJdInput] = useState<JdInput>({ jdText: "", jobTitle: "", company: "" });
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterOutput | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const openPaidFeatureModal = useUIStore((s) => s.openPaidFeatureModal);

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
  const { data: creditsData } = useCredits();
  const isOutOfCredits = creditsData ? creditsData.data.remaining <= 0 : false;

  const handleJdChange = useCallback((input: JdInput) => {
    setJdInput(input);
    setError(null);
  }, []);

  const handleGenerate = async () => {
    if (!settings || !jdInput.jdText.trim()) return;
    if (isOutOfCredits) {
      openPaidFeatureModal({
        feature: "ai_credits",
        title: "Out of AI credits this month",
        description: "Upgrade to Pro (400/mo) or Max (1000/mo) to keep tailoring resumes.",
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
      const tone = optimizeModeData?.data.optimizeMode ?? OptimizeMode.HONEST;

      const { resume: doc, matchAnalysis: ma } = await seekerService.optimizeResume({
        jdText: jdInput.jdText,
        jobTitle: jdInput.jobTitle || "Untitled Position",
        company: jdInput.company || "Company",
        tone,
        profile,
        requiredSkills: [],
        preferredSkills: [],
      });
      setResume(doc);
      setMatchAnalysis(ma);

      const { coverLetter: cl } = await seekerService.generateCoverLetter({
        jdText: jdInput.jdText,
        jobTitle: jdInput.jobTitle || "Untitled Position",
        company: jdInput.company || "Company",
        tone,
        profile,
        requiredSkills: [],
        preferredSkills: [],
      });
      setCoverLetter(cl);

      queryClient.invalidateQueries({ queryKey: SEEKER_CREDITS_QUERY_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = Boolean(jdInput.jdText.trim()) && !isGenerating;

  if (settingsLoading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel — JD input + controls + match analysis + cover letter */}
      <div className="flex flex-col gap-6 w-full lg:w-[420px] shrink-0">
        <div className="rounded-xl border border-brand-border bg-white p-6">
          <JdInputPanel value={jdInput} onChange={handleJdChange} />
          <div className="mt-4 flex items-center gap-3">
            {isOutOfCredits && (
              <p className="text-xs text-brand-danger">
                You&apos;re out of AI credits this month.{" "}
                <Link href="/pricing" className="font-medium underline">
                  Upgrade
                </Link>{" "}
                to keep tailoring.
              </p>
            )}
            {!isOutOfCredits && (
              <>
                <Button variant="primary" size="sm" onClick={handleGenerate} disabled={!canGenerate}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" />
                      Generating…
                    </>
                  ) : (
                    "Generate resume"
                  )}
                </Button>
                {error && <p className="text-xs text-brand-danger">{error}</p>}
              </>
            )}
          </div>
        </div>

        {matchAnalysis && <MatchAnalysisPanel analysis={matchAnalysis} />}
        {coverLetter && <CoverLetterPanel coverLetter={coverLetter} />}
      </div>

      {/* Right panel — realistic resume preview */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-brand-border bg-white p-1 overflow-hidden">
          {resume ? (
            <ResumePreview doc={resume} />
          ) : (
            <div className="flex items-center justify-center py-24 text-sm text-brand-foreground-muted">
              <div className="text-center">
                <p className="mb-2">Your tailored resume will appear here</p>
                <p className="text-xs text-brand-foreground-secondary">
                  Paste a job description and click Generate to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}