"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FlaskConical, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUIStore } from "@/store/use-ui-store";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

const ResumePdfPreview = dynamic(
  () =>
    import(
      "@/modules/applications/components/ResumePdfPreview"
    ).then((m) => m.ResumePdfPreview),
  { ssr: false },
);

const CHIPS = [
  { label: "Stronger action verbs", instruction: "Use stronger action verbs throughout the experience bullets" },
  { label: "Shorten summary", instruction: "Shorten my professional summary to 2-3 concise sentences" },
  { label: "Remove irrelevant skills", instruction: "Remove skills not related to this job description" },
  { label: "Add quantified metrics", instruction: "Add more quantified metrics and measurable results to experience bullets" },
  { label: "Match JD tone", instruction: "Rewrite the resume to match the tone and style of the job description" },
];

interface AiRewritePanelProps {
  applicationId: string;
  resumeJson: ResumeDocument;
  onAccepted: (version: { id: string; version: number }) => void;
}

export function AiRewritePanel({ applicationId, resumeJson, onAccepted }: AiRewritePanelProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    resumeJson: ResumeDocument;
    previousResumeJson: ResumeDocument;
    version: number;
    id: string;
  } | null>(null);
  const openPaidFeatureModal = useUIStore((s) => s.openPaidFeatureModal);

  const handleRewrite = async (inst: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: inst, resumeJson }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "quota_exceeded") {
          openPaidFeatureModal({
            feature: "resume_generation",
            title: "No generations left",
            description: `You've used all ${json.limit ?? "your"} generations this month. Upgrade to keep rewriting your resume.`,
          });
          return;
        }
        toast.error(json.message ?? json.error ?? "Rewrite failed");
        return;
      }
      setResult(json);
    } catch {
      toast.error("Rewrite failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    onAccepted({ id: result.id, version: result.version });
    setResult(null);
  };

  const handleDiscard = () => {
    setResult(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-brand-primary" />
        <h4 className="text-sm font-bold text-brand-foreground">AI Rewrite</h4>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            className="rounded-lg border border-brand-border px-2.5 py-1 text-xs font-medium text-brand-foreground hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50"
            disabled={loading}
            onClick={() => handleRewrite(chip.instruction)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Freeform input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="Custom instruction..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && instruction.trim() && handleRewrite(instruction.trim())}
          disabled={loading}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleRewrite(instruction.trim())}
          disabled={loading || !instruction.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-brand-foreground-muted" />
        </div>
      )}

      {/* Diff result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-600">Changes preview</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                <X className="mr-1 h-3.5 w-3.5" />
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={handleAccept}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Accept
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <p className="font-medium text-brand-foreground-muted">Before</p>
              <div className="rounded-lg border border-brand-border bg-white overflow-hidden max-h-[400px] overflow-y-auto">
                <ResumePdfPreview doc={result.previousResumeJson} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-green-600">After</p>
              <div className="rounded-lg border border-green-200 bg-white overflow-hidden max-h-[400px] overflow-y-auto">
                <ResumePdfPreview doc={result.resumeJson} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
