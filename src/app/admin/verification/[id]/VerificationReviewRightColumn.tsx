"use client";

import { useEffect, useState } from "react";

import type { GithubAnalysisOutput } from "@/lib/ai-prompts";
import { AdminReviewForm } from "./AdminReviewForm";
import { AiRecommendationBanner } from "./AiRecommendationBanner";

/*
 * VerificationReviewRightColumn
 * Client component that triggers the AI GitHub scan on mount and renders
 * the AI recommendation banner + admin review form.
 * Skips the scan if aiSummary already exists (admin re-opened a reviewed case).
 */

interface VerificationReviewRightColumnProps {
  engineerId: string;
  reviewId: string;
  canReview: boolean;
  currentStatus: string;
  existingAiSummary: {
    model: string;
    promptVersion: string;
    inputSnapshot: object;
    output: GithubAnalysisOutput;
    overrideReason?: string;
  } | null;
}

type BannerStatus =
  | "loading"
  | "ok"
  | "inaccessible"
  | "private"
  | "error"
  | "idle";

interface AiScanResponse {
  status: "ok" | "inaccessible" | "private" | "error";
  data?: GithubAnalysisOutput;
  aiSummary?: {
    model: string;
    promptVersion: string;
    inputSnapshot: object;
    output: GithubAnalysisOutput;
  };
  reason?: string;
}

export function VerificationReviewRightColumn({
  engineerId,
  reviewId,
  canReview,
  currentStatus,
  existingAiSummary,
}: VerificationReviewRightColumnProps) {
  const [bannerStatus, setBannerStatus] = useState<BannerStatus>(
    existingAiSummary ? "ok" : "loading",
  );
  const [aiOutput, setAiOutput] = useState<GithubAnalysisOutput | null>(
    existingAiSummary?.output ?? null,
  );
  const [aiSummaryMeta, setAiSummaryMeta] = useState<{
    model: string;
    promptVersion: string;
    inputSnapshot: object;
  } | null>(
    existingAiSummary
      ? {
          model: existingAiSummary.model,
          promptVersion: existingAiSummary.promptVersion,
          inputSnapshot: existingAiSummary.inputSnapshot,
        }
      : null,
  );

  useEffect(() => {
    // If aiSummary already exists, skip the scan
    if (existingAiSummary || !canReview) return;

    let cancelled = false;

    async function runScan() {
      setBannerStatus("loading");

      try {
        const response = await fetch(`/api/admin/verification/${engineerId}/ai-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const result = (await response.json()) as AiScanResponse;

        if (cancelled) return;

        if (result.status === "ok" && result.data && result.aiSummary) {
          setAiOutput(result.data);
          setAiSummaryMeta({
            model: result.aiSummary.model,
            promptVersion: result.aiSummary.promptVersion,
            inputSnapshot: result.aiSummary.inputSnapshot,
          });
          setBannerStatus("ok");
        } else if (result.status === "inaccessible") {
          setBannerStatus("inaccessible");
        } else if (result.status === "private") {
          setBannerStatus("private");
        } else {
          setBannerStatus("error");
        }
      } catch {
        if (!cancelled) {
          setBannerStatus("error");
        }
      }
    }

    runScan();

    return () => {
      cancelled = true;
    };
  }, [canReview, engineerId, existingAiSummary]);

  if (!canReview) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <p className="mb-1 text-sm font-semibold text-brand-foreground">
          Review complete
        </p>
        <p className="text-sm text-brand-foreground-muted">
          Status:{" "}
          <span className="font-medium">{currentStatus}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AiRecommendationBanner
        recommendation={aiOutput?.recommendation ?? null}
        confidence={aiOutput?.confidence ?? null}
        scoreSuggestion={aiOutput?.scoreSuggestion ?? null}
        strengthLevel={aiOutput?.strengthLevel ?? null}
        summary={aiOutput?.summary ?? null}
        strengths={aiOutput?.strengths ?? []}
        gaps={aiOutput?.gaps ?? []}
        status={bannerStatus}
      />
      <AdminReviewForm
        engineerId={engineerId}
        reviewId={reviewId}
        aiOutput={aiOutput}
        aiSummaryMeta={aiSummaryMeta}
      />
    </div>
  );
}
