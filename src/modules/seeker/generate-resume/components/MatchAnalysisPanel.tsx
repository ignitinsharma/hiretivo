"use client";

import { MatchThreshold } from "@/constants/enums";
import type { MatchAnalysis } from "@/lib/ai-prompts";

interface MatchAnalysisPanelProps {
  analysis: MatchAnalysis;
}

/*
 * MatchAnalysisPanel
 * Shows the match analysis from the tailored resume: matched vs missing skills
 * and the overall match score. Skill tags are color-coded — matched in green,
 * missing in red.
 * @param analysis - match_analysis from the optimize-resume response
 */
export function MatchAnalysisPanel({ analysis }: MatchAnalysisPanelProps) {
  const { matched_requirements, missing_requirements, match_score } = analysis;
  const isStrong = match_score >= MatchThreshold.STRONG;
  const isGood = match_score >= MatchThreshold.GOOD;
  const scoreColor = isStrong
    ? "text-brand-success"
    : isGood
      ? "text-yellow-600"
      : "text-brand-danger";

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6">
      <h2 className="font-semibold text-sm text-brand-foreground mb-3">Match analysis</h2>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-2xl font-bold ${scoreColor}`}>{match_score}%</span>
        <span className="text-xs text-brand-foreground-muted">match score</span>
      </div>

      {matched_requirements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-brand-foreground mb-1.5">
            Matched ({matched_requirements.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {matched_requirements.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs text-green-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missing_requirements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-brand-foreground mb-1.5">
            Missing ({missing_requirements.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {missing_requirements.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}