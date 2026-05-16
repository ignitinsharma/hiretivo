"use client";

import { Loader2 } from "lucide-react";

/*
 * AiRecommendationBanner
 * Displays the AI scan status and recommendation for admin verification.
 * Shows loading spinner during scan, amber banners for skip conditions,
 * and color-coded recommendation banners (green=APPROVE, red=REJECT, amber=low confidence).
 */

interface AiRecommendationBannerProps {
  recommendation: "APPROVE" | "REJECT" | null;
  confidence: number | null; // 0-1
  summary: string | null;
  status:
    | "loading"
    | "ok"
    | "inaccessible"
    | "private"
    | "error"
    | "idle";
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function AiRecommendationBanner({
  recommendation,
  confidence,
  summary,
  status,
}: AiRecommendationBannerProps) {
  /* Loading state */
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-4">
        <Loader2 className="h-5 w-5 animate-spin text-brand-foreground-muted" />
        <p className="text-sm text-brand-foreground-muted">
          Scanning GitHub profile&hellip;
        </p>
      </div>
    );
  }

  /* Skip states */
  if (status === "inaccessible" || status === "private") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          AI scan skipped &mdash; GitHub profile not accessible. Review
          manually.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          AI scan failed &mdash; review manually.
        </p>
      </div>
    );
  }

  /* Idle state (before scan or when aiSummary already exists and skipped) */
  if (status === "idle" || !recommendation) {
    return null;
  }

  /* OK state with recommendation */
  const isLowConfidence = confidence !== null && confidence < 0.5;
  const isApprove = recommendation === "APPROVE";

  let bannerClass: string;
  if (isLowConfidence) {
    bannerClass =
      "rounded-xl border border-amber-200 bg-amber-50 p-4";
  } else if (isApprove) {
    bannerClass =
      "rounded-xl border border-green-200 bg-green-50 p-4";
  } else {
    bannerClass =
      "rounded-xl border border-red-200 bg-red-50 p-4";
  }

  return (
    <div className={bannerClass}>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {isLowConfidence ? (
            <>
              Low confidence ({confidence !== null ? formatConfidence(confidence) : "N/A"})
              &nbsp;&mdash; review manually
            </>
          ) : (
            <>
              AI Recommendation: {recommendation}
              {confidence !== null && (
                <> ({formatConfidence(confidence)} confidence)</>
              )}
            </>
          )}
        </p>
        <span className="rounded bg-brand-primary/10 px-2 py-0.5 text-xs text-brand-primary">
          AI Draft
        </span>
      </div>
      {summary && (
        <p className="mt-2 text-sm text-brand-foreground-muted">
          {summary}
        </p>
      )}
    </div>
  );
}
