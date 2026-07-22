"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Check,
  Download,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumePreviewContent } from "@/modules/applications/components/ResumePreviewContent";
import { ResumeEditor, type ResumeEditorHandle } from "@/modules/applications/components/ResumeEditor";
import { AiRewritePanel } from "@/modules/applications/components/AiRewritePanel";
import { QuotaBadge } from "@/modules/applications/components/QuotaBadge";
import { toast } from "sonner";
import type {
  ResumeDocument,
  ResumeMatchMeta,
} from "@/lib/validations/resume.schema";

const TOOL_GROUPS: Record<string, string[]> = {
  Analytics: ["GA4", "Segment", "Amplitude", "Mixpanel", "Heap", "PostHog", "Plausible", "Google Analytics"],
  "Feature Flags": ["LaunchDarkly", "Statsig", "Optimizely", "Split", "Unleash"],
  DevOps: ["Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "Jenkins", "GitHub Actions"],
  Frontend: ["React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "HTML", "CSS"],
  Backend: ["Node.js", "Django", "Rails", "Spring", "Express", "FastAPI", "REST APIs", "GraphQL"],
  Database: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB", "Prisma"],
  Design: ["Figma", "Sketch", "Adobe XD", "InVision", "Wireframing"],
  "Project Management": ["Jira", "Linear", "Asana", "Notion", "ClickUp", "Trello"],
  Testing: ["Jest", "Vitest", "Cypress", "Playwright", "Selenium", "Mocha"],
};

function findBestCategory(
  skill: string,
  categories: { name: string; items: string[] }[],
): number {
  const s = skill.toLowerCase();

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i].name.toLowerCase();
    if (c.includes(s) || s.includes(c)) return i;
  }

  for (const [group, members] of Object.entries(TOOL_GROUPS)) {
    const inGroup = members.some(
      (m) => m.toLowerCase() === s || s.includes(m.toLowerCase()),
    );
    if (!inGroup) continue;
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].name.toLowerCase().includes(group.toLowerCase())) return i;
      const hasSibling = categories[i].items.some((item) =>
        members.some((m) => item.toLowerCase() === m.toLowerCase()),
      );
      if (hasSibling) return i;
    }
  }

  return 0;
}

interface ApplicationVersion {
  id: string;
  version: number;
  sourceType: string;
  resumeJson: unknown;
  createdAt: string;
}

interface ApplicationDetail {
  id: string;
  status: string;
  matchScore: number | null;
  generationCount: number;
  automationStatus: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    companyName: string;
    externalApplyUrl: string | null;
    applyType: string;
    description: string | null;
    skills: string[];
  };
  matchMeta: ResumeMatchMeta | null;
  contentDiff: {
    summary: Array<{ text: string; added: boolean }>;
    bullets: Record<string, Array<{ text: string; added: boolean }>>;
  } | null;
  activeVersion: ApplicationVersion | null;
  versions: ApplicationVersion[];
}

async function fetchApplication(id: string): Promise<ApplicationDetail> {
  const res = await fetch(`/api/applications/${id}`);
  if (!res.ok) throw new Error("Failed to load application");
  return res.json();
}

export function ApplicationPageClient() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const applicationId = params.id as string;
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "cover-letter" | "editor">(
    "resume",
  );
  const [prevMatchMeta, setPrevMatchMeta] = useState<ResumeMatchMeta | null>(null);
  const [applying, setApplying] = useState(false);
  const [linkBannerDismissed, setLinkBannerDismissed] = useState(false);
  const [pendingSkill, setPendingSkill] = useState<string | null>(null);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const editorRef = useRef<ResumeEditorHandle>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => fetchApplication(applicationId),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.automationStatus === "GENERATING" ? 2000 : false;
    },
  });

  const visibleVersion = data?.versions.find(
    (v) => v.id === (selectedVersionId ?? data.activeVersion?.id),
  );

  const handleDownload = async () => {
    if (!data || !visibleVersion?.resumeJson) return;
    setDownloading(true);
    try {
      const docToDownload = displayDoc ?? resumeDoc;
      const res = await fetch("/api/resume/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson: docToDownload }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.job.title.replace(/\s+/g, "_")}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download resume");
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    setPrevMatchMeta(data?.matchMeta ?? null);
    setRegenerating(true);
    try {
      const baseResume = editorRef.current?.getForm();
      const res = await fetch(
        `/api/applications/${applicationId}/generate?forceGenerate=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(baseResume ? { baseResumeJson: baseResume } : {}),
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Regeneration failed");
        setPrevMatchMeta(null);
        return;
      }
      toast.success("Resume regenerated");
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
    } catch {
      toast.error("Failed to regenerate resume");
      setPrevMatchMeta(null);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddMissingSkill = async (skill: string) => {
    if (!resumeDoc) return;
    setSavingSkill(skill);
    try {
      const next = JSON.parse(JSON.stringify(resumeDoc)) as ResumeDocument;
      next.missingSkills = (next.missingSkills ?? []).filter((s) => s !== skill);
      const catIdx = findBestCategory(skill, next.skills.categories);
      next.skills.categories[catIdx] = {
        ...next.skills.categories[catIdx],
        items: [...next.skills.categories[catIdx].items, skill],
      };
      const res = await fetch(`/api/applications/${applicationId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson: next }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(`"${skill}" added to resume`);
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
      setPendingSkill(null);
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setSavingSkill(null);
    }
  };

  const handleMarkApplied = async () => {
    setApplying(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_applied" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to mark as applied");
        return;
      }
      toast.success("Marked as applied");
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
    } catch {
      toast.error("Failed to mark as applied");
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-brand-foreground-muted">
          Application not found
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/dashboard/tracker")}
        >
          Back to tracker
        </Button>
      </div>
    );
  }

  const meta = data.matchMeta;
  const resumeDoc = visibleVersion?.resumeJson as ResumeDocument | undefined;
  const displayDoc = editorRef.current?.getForm() ?? resumeDoc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/tracker")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-foreground">
            {data.job.title}
          </h1>
          <p className="text-sm text-brand-foreground-muted mt-1">
            {data.job.companyName}
          </p>
        </div>
      </div>

      {/* Link verification banner */}
      {!linkBannerDismissed && data.automationStatus === "READY" && resumeDoc && hasLinks(resumeDoc) && (
        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex items-center gap-3">
          <ExternalLink className="h-4 w-4 text-brand-primary shrink-0" />
          <p className="flex-1 text-sm text-brand-foreground">
            Before submitting, download your resume and verify all links work. If not, update them in the Editor.
          </p>
          <button
            onClick={() => setLinkBannerDismissed(true)}
            className="text-brand-foreground-muted hover:text-brand-foreground shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Match Score */}
          <Card>
            <h3 className="text-sm font-bold text-brand-foreground mb-3">
              Match Score
            </h3>
            {prevMatchMeta && prevMatchMeta.matchScore != null && meta?.matchScore != null && prevMatchMeta.matchScore !== meta.matchScore ? (
              <div className="text-xs text-brand-foreground-muted mb-3 space-y-0.5">
                <span className="text-brand-foreground-muted">
                  Before <span className="font-semibold text-brand-foreground">{prevMatchMeta.matchScore}</span>
                </span>
                <span className="mx-2 text-brand-foreground-muted">→</span>
                <span className="font-semibold text-green-600">{meta.matchScore}</span>
                <span className="ml-1 text-green-600 font-semibold">
                  ↑ +{meta.matchScore - prevMatchMeta.matchScore} pts
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-brand-border"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(meta?.matchScore ?? 0) * 0.97} 100`}
                    className={
                      (meta?.matchScore ?? 0) >= 70
                        ? "text-green-600"
                        : (meta?.matchScore ?? 0) >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-foreground">
                  {meta?.matchScore ?? "—"}
                </span>
              </div>
              <div className="text-xs text-brand-foreground-muted">
                {meta?.matchScore != null && meta.matchScore >= 70
                  ? "Strong match"
                  : meta?.matchScore != null && meta.matchScore >= 40
                    ? "Moderate match"
                    : "Needs improvement"}
              </div>
            </div>
          </Card>

          {/* Job Description */}
          <Card>
            <h3 className="text-sm font-bold text-brand-foreground mb-3">
              Job Description
            </h3>
<p className="text-xs text-brand-foreground leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
  {data.job.description ?? "No description available"}
</p>
{data.job.externalApplyUrl && (
  <a
    href={data.job.externalApplyUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline mt-2"
  >
    <ExternalLink className="h-3 w-3" />
    View original job description
  </a>
)}
          </Card>

          {/* Added Keywords */}
          {meta?.addedKeywords && meta.addedKeywords.length > 0 && (
            <Card>
              <h3 className="text-sm font-bold text-brand-foreground mb-3">
                Keywords Added
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {meta.addedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Missing Keywords */}
          {meta?.missingKeywords && meta.missingKeywords.length > 0 && (
            <Card>
              <h3 className="text-sm font-bold text-brand-foreground mb-3">
                Keywords Missing
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {meta.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                  >
                    <Circle className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Skills Checklist */}
          {meta && (
            <Card>
              <h3 className="text-sm font-bold text-brand-foreground mb-3">
                Skills Checklist
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-foreground-muted">Required</span>
                  <span className="font-semibold text-brand-foreground">
                    {meta.requiredSkillsMatched}/{meta.requiredSkillsTotal}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-border">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      meta.requiredSkillsTotal > 0 &&
                       meta.requiredSkillsMatched / meta.requiredSkillsTotal >=
                         1
                        ? "bg-green-600"
                        : meta.requiredSkillsTotal > 0 &&
                            meta.requiredSkillsMatched /
                              meta.requiredSkillsTotal >=
                              0.5
                          ? "bg-amber-600"
                          : "bg-red-600"
                    }`}
                    style={{
                      width:
                        meta.requiredSkillsTotal > 0
                          ? `${(meta.requiredSkillsMatched / meta.requiredSkillsTotal) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-3">
                  <span className="text-brand-foreground-muted">
                    Preferred
                  </span>
                  <span className="font-semibold text-brand-foreground">
                    {meta.preferredSkillsMatched}/{meta.preferredSkillsTotal}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-brand-border">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      meta.preferredSkillsTotal > 0 &&
                       meta.preferredSkillsMatched / meta.preferredSkillsTotal >=
                         1
                        ? "bg-green-600"
                        : meta.preferredSkillsTotal > 0 &&
                            meta.preferredSkillsMatched /
                              meta.preferredSkillsTotal >=
                              0.5
                          ? "bg-amber-600"
                          : "bg-blue-600"
                    }`}
                    style={{
                      width:
                        meta.preferredSkillsTotal > 0
                          ? `${(meta.preferredSkillsMatched / meta.preferredSkillsTotal) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <h3 className="text-sm font-bold text-brand-foreground mb-3">
              Actions
            </h3>
            {data.automationStatus === "GENERATING" ? (
              <Button variant="secondary" size="sm" className="w-full" disabled>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Generating resume...
              </Button>
            ) : data.automationStatus === "FAILED" ? (
              <Button variant="secondary" size="sm" className="w-full" disabled>
                Resume generation failed
              </Button>
            ) : data.automationStatus === "SUBMITTED" ? (
              <Button variant="default" size="sm" className="w-full" disabled>
                <Check className="mr-1.5 h-4 w-4" />
                Applied ✓
              </Button>
            ) : !data.activeVersion ? (
              <Button variant="secondary" size="sm" className="w-full" disabled>
                Generate a resume first
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleMarkApplied}
                disabled={applying}
              >
                {applying ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                I've applied
              </Button>
            )}
          </Card>

          {/* Quota */}
          <QuotaBadge />

          {/* Timeline */}
          <Card>
            <h3 className="text-sm font-bold text-brand-foreground mb-3">
              Timeline
            </h3>
            <div className="space-y-3">
              <TimelineItem
                label="Application Created"
                time={data.createdAt}
                isLatest={data.versions.length === 0 && data.automationStatus !== "SUBMITTED"}
                dot="bg-brand-primary"
              />
              {data.versions.length > 0 && (
                <TimelineItem
                  label="Resume Generated"
                  time={data.versions[data.versions.length - 1].createdAt}
                  isLatest={data.automationStatus !== "SUBMITTED"}
                  dot="bg-gray-500"
                />
              )}
              {data.automationStatus === "SUBMITTED" && (
                <TimelineItem
                  label="Applied"
                  time={data.updatedAt}
                  isLatest
                  dot="bg-green-500"
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel — Resume + Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-border px-5 py-3 flex-wrap gap-y-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "resume"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-brand-foreground-muted hover:text-brand-foreground"
                  }`}
                >
                  Resume
                </button>
                <button
                  onClick={() => setActiveTab("cover-letter")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "cover-letter"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-brand-foreground-muted hover:text-brand-foreground"
                  }`}
                >
                  Cover Letter
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "editor"
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-brand-foreground-muted hover:text-brand-foreground"
                  }`}
                >
                  Editor
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="text-xs border border-brand-border rounded-lg h-9 px-2 bg-white text-brand-foreground"
                  value={selectedVersionId ?? data.activeVersion?.id ?? ""}
                  onChange={(e) => setSelectedVersionId(e.target.value || null)}
                >
                  {data.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} —{" "}
                      {v.sourceType === "ai-generated"
                        ? "AI Generated"
                        : v.sourceType === "uploaded"
                          ? "Uploaded"
                          : "Manual Edit"}
                    </option>
                  ))}
                </select>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!data.activeVersion || downloading}
                >
                  {downloading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                {data.job.applyType === "EXTERNAL" && data.job.externalApplyUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      window.open(data.job.externalApplyUrl!, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    View job posting
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                  )}
                  {regenerating ? "Generating..." : "Regenerate"}
                </Button>
              </div>
            </div>

            {resumeDoc && (
              <div className="border-t border-brand-border px-5 py-4">
                <AiRewritePanel
                  applicationId={applicationId}
                  resumeJson={displayDoc ?? resumeDoc}
                  onAccepted={(version) => {
                    setActiveTab("resume");
                    setSelectedVersionId(version.id);
                    queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
                  }}
                />
              </div>
            )}

            <div className="p-5 pt-2">
              {activeTab === "resume" ? (
                resumeDoc ? (
                  <div>
                    {resumeDoc.missingSkills && resumeDoc.missingSkills.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-amber-600 shrink-0" />
                          <p className="text-sm text-amber-900">
                            Skills to consider adding if accurate:
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeDoc.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs text-amber-900"
                            >
                              {skill}
                              {pendingSkill === skill ? (
                                <span className="inline-flex items-center gap-1 ml-1">
                                  <span className="text-[10px] text-amber-700">Add?</span>
                                  <button
                                    onClick={() => handleAddMissingSkill(skill)}
                                    disabled={savingSkill === skill}
                                    className="text-green-600 hover:text-green-800 font-bold disabled:opacity-50"
                                  >
                                    {savingSkill === skill ? "..." : "Yes"}
                                  </button>
                                  <button
                                    onClick={() => setPendingSkill(null)}
                                    disabled={savingSkill === skill}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setPendingSkill(skill)}
                                  className="text-amber-600 hover:text-green-600 font-bold"
                                >
                                  +
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
                      <ResumePreviewContent doc={displayDoc ?? resumeDoc} newlyAddedSkills={meta?.addedKeywords ?? []} contentDiff={data.contentDiff ?? undefined} />
                    </div>
                  </div>
                ) : data.automationStatus === "GENERATING" ? (
                  <div className="space-y-5 p-5 min-h-[900px]">
                    {/* Name + contact */}
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-3 w-3/4" />
                    {/* Summary */}
                    <div className="pt-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    {/* Skills */}
                    <div className="pt-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    {/* Experience */}
                    <div className="pt-1 space-y-4">
                      <Skeleton className="h-4 w-1/3" />
                      <div className="space-y-2 pl-4">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                      <div className="space-y-2 pl-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                    {/* Education */}
                    <div className="pt-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    {/* Projects */}
                    <div className="pt-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-brand-foreground-muted">
                      No resume generated yet
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-4"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                    >
                      {regenerating ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : null}
                      {regenerating ? "Generating resume..." : "Generate Resume"}
                    </Button>
                  </div>
                )
              ) : activeTab === "editor" ? (
                null
              ) : (
                <CoverLetterPanel applicationId={applicationId} />
              )}

              {/* Always-mounted editor (hidden when not active) for state persistence across tab switches */}
              {resumeDoc && (
                <div style={{ display: activeTab === "editor" ? "block" : "none" }}>
                  <ResumeEditor
                    ref={editorRef}
                    doc={resumeDoc}
                    versionId={visibleVersion?.id}
                  />
                </div>
              )}
              {!resumeDoc && activeTab === "editor" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-brand-foreground-muted">
                    Generate a resume first before editing
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function hasLinks(doc: ResumeDocument): boolean {
  const p = doc.personalInfo;
  return !!(p.linkedin || p.github || p.websiteUrl);
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-brand-border bg-white p-5 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function TimelineItem({
  label,
  time,
  isLatest,
  dot,
}: {
  label: string;
  time: string;
  isLatest?: boolean;
  dot: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-2.5 w-2.5 rounded-full ${dot} mt-1`} />
        {!isLatest && <div className="w-px flex-1 bg-brand-border mt-1" />}
      </div>
      <div className="pb-3">
        <p className="text-xs font-medium text-brand-foreground">{label}</p>
        <p className="text-[11px] text-brand-foreground-muted mt-0.5">
          {formatRelativeTime(time)}
        </p>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CoverLetterPanel({ applicationId }: { applicationId: string }) {
  const [generating, setGenerating] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cover-letter", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to generate cover letter");
        return;
      }
      toast.success("Cover letter generated");
      refetch();
    } catch {
      toast.error("Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-brand-foreground-muted" />
      </div>
    );
  }

  return (
    <div>
      {data?.content ? (
        <div className="prose prose-sm max-w-none">
          <div className="rounded-xl border border-brand-border bg-white p-6 whitespace-pre-line text-sm text-brand-foreground leading-relaxed">
            {data.content}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-brand-foreground-muted mb-4">
            No cover letter yet
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Generate Cover Letter
          </Button>
        </div>
      )}
    </div>
  );
}
