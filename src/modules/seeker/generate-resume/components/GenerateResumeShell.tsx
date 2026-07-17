"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { seekerService, type SeekerSettingsData } from "@/services/seeker.service";
import { jobService } from "@/services/job.service";
import { JdInputPanel } from "@/modules/seeker/generate-resume/components/JdInputPanel";
import { EditableResumePreview } from "@/modules/seeker/generate-resume/components/EditableResumePreview";
import { MatchAnalysisPanel } from "@/modules/seeker/generate-resume/components/MatchAnalysisPanel";
import { EditableCoverLetter } from "@/modules/seeker/generate-resume/components/EditableCoverLetter";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";
import type { MatchAnalysis, CoverLetterOutput } from "@/lib/ai-prompts";

interface JdInput {
  jdText: string;
  jobTitle: string;
  company: string;
}

function buildDefaultResume(settings: SeekerSettingsData): ResumeDocument {
  return {
    fullName: settings.name || "Your Name",
    headline: settings.headline || "",
    contact: {
      email: settings.email || "",
      location: settings.location || "",
      websiteUrl: settings.websiteUrl || "",
      linkedinUrl: settings.linkedinUrl || "",
      githubUrl: settings.githubUrl || "",
    },
    summary: settings.bio || "",
    skillGroups: settings.skills.length > 0
      ? [{ category: "Skills", skills: settings.skills.map((s) => s.name) }]
      : [],
    experience: (settings.workExperiences || []).map((exp) => ({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      isCurrent: exp.isCurrent,
      bullets: exp.description ? [exp.description] : [],
    })),
    education: (settings.educations || []).map((edu) => ({
      institution: edu.institution,
      degree: edu.degree || "",
      major: edu.major || "",
      graduationDate: edu.graduationDate || "",
    })),
    certifications: [],
    projects: [],
  };
}

interface GenerateResumeShellProps {
  jobId?: string;
  applicationId?: string;
}

export function GenerateResumeShell({ jobId, applicationId }: GenerateResumeShellProps) {
  const [jdInput, setJdInput] = useState<JdInput>({ jdText: "", jobTitle: "", company: "" });
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterOutput | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingCl, setIsGeneratingCl] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const { data: settings, isLoading: settingsLoading } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!jobId) return;

    jobService.getJobById(jobId).then((res) => {
      const job = res.job;
      setJdInput({
        jdText: job.description || "",
        jobTitle: job.title || "",
        company: job.companyName || "",
      });
    }).catch(() => {
      // silently fail — user can paste JD manually
    });
  }, [jobId]);

  const handleJdChange = useCallback((input: JdInput) => {
    setJdInput(input);
    setError(null);
  }, []);

  const handleResumeChange = useCallback((doc: ResumeDocument) => {
    setResume(doc);
  }, []);

  const handleGenerate = async () => {
    if (!settings || !jdInput.jdText.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const defaultResume = buildDefaultResume(settings.data);
      setResume(defaultResume);
      setMatchAnalysis({
        matched_requirements: [],
        missing_requirements: [],
        match_score: 0,
      });
      setCoverLetter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) return;
    setIsDownloading(true);

    try {
      const res = await fetch("/api/seeker/apply/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCoverLetterChange = useCallback((cl: CoverLetterOutput) => {
    setCoverLetter(cl);
  }, []);

  const handleGenerateCoverLetter = async () => {
    if (!jdInput.jdText.trim()) return;
    setIsGeneratingCl(true);
    setError(null);

    try {
      const res = await fetch("/api/seeker/apply/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jdInput.jobTitle,
          company: jdInput.company,
          jdText: jdInput.jdText,
          resumeName: resume?.fullName || "Candidate",
          resumeSummary: resume?.summary || "",
          resumeSkills: (resume?.skillGroups || []).flatMap((g) => g.skills),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate cover letter");
      }

      const json = await res.json();
      setCoverLetter(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cover letter.");
    } finally {
      setIsGeneratingCl(false);
    }
  };

  const canGenerate = Boolean(jdInput.jdText.trim()) && !isGenerating;

  if (settingsLoading) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* JD input */}
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <JdInputPanel value={jdInput} onChange={handleJdChange} />
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={handleGenerate} disabled={!canGenerate}>
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-1.5" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generate resume
              </>
            )}
          </Button>
          {error && <p className="text-xs text-brand-danger">{error}</p>}
        </div>
      </div>

      {resume && (
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Download PDF
            </Button>

            <Button variant="ghost" size="sm" onClick={handleGenerateCoverLetter} disabled={isGeneratingCl}>
              {isGeneratingCl ? (
                <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Generate cover letter
            </Button>
          </div>

          {/* Editable resume preview */}
          <EditableResumePreview doc={resume} onChange={handleResumeChange} />

          {/* Match analysis */}
          {matchAnalysis && (
            <MatchAnalysisPanel analysis={matchAnalysis} />
          )}

          {/* Cover letter */}
          {coverLetter && (
            <EditableCoverLetter coverLetter={coverLetter} onChange={handleCoverLetterChange} />
          )}
        </div>
      )}
    </div>
  );
}
