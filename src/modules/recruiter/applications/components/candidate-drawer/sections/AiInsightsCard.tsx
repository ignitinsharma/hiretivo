import {
  AlertTriangle,
  FileText,
  Lightbulb,
  Puzzle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { sanitizeHtml } from "@/lib/utils/html-sanitizer";
import type { AiState } from "../types";
import { getFitBadge } from "../utils";
import { AiInsightsGate } from "./AiInsightsGate";
import { ScreeningQuestionsSection } from "./ScreeningQuestionsSection";

interface AiInsightsCardProps {
  state: AiState;
}

/* Inline-tag styling for skill pills (<mark>) and gap callouts (<em>) inside section bodies. */
const SECTION_BODY_CLASSES =
  "text-sm leading-relaxed text-brand-foreground-muted [&_mark]:rounded [&_mark]:bg-[#ede9fe] [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:font-medium [&_mark]:text-brand-primary [&_em]:italic [&_em]:font-medium [&_em]:text-brand-primary";

export function AiInsightsCard({ state }: AiInsightsCardProps) {
  // Locked: no AI access on plan, or daily free limit exhausted — both show the upgrade gate.
  if (state.isPlanGated || (state.isError && state.errorMessage === "PLAN_GATED")) {
    return <AiInsightsGate />;
  }

  if (state.isPending) {
    return (
      <section className="rounded-xl border border-[#ece9fe] bg-[#f5f3ff] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-44 rounded bg-[#ede9fe]" />
          <div className="h-3 w-full rounded bg-[#ede9fe]" />
          <div className="h-3 w-5/6 rounded bg-[#ede9fe]" />
          <div className="h-3 w-2/3 rounded bg-[#ede9fe]" />
        </div>
      </section>
    );
  }

  if (state.isError) return null;
  if (!state.summary) return null;

  const badge = state.fitLevel ? getFitBadge(state.fitLevel) : null;
  const score = state.fitScore ?? 0;

  // Prose sections rendered through sanitizeHtml (carry inline <mark>/<em>).
  const proseSections: { key: string; title: string; icon: LucideIcon; body?: string }[] = [
    { key: "summary", title: "Summary", icon: FileText, body: state.summary },
    { key: "skillMatch", title: "Skill Match", icon: Puzzle, body: state.skillMatch },
    {
      key: "whyFit",
      title: badge ? `Why ${badge.label}?` : "Why This Fit?",
      icon: AlertTriangle,
      body: state.whyFit,
    },
    { key: "areasToExplore", title: "Areas to Explore", icon: Lightbulb, body: state.areasToExplore },
  ];

  const questions = state.screeningQuestions ?? [];

  return (
    <section className="rounded-xl border border-[#ece9fe] bg-[#f5f3ff] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="inline-flex items-center gap-2 text-base font-semibold text-brand-foreground">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          AI Candidate Insights
        </p>
        <div className="flex flex-col items-end gap-1.5">
          {score > 0 ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#ede9fe]">
                <span className="block h-full rounded-full bg-brand-primary" style={{ width: `${score}%` }} />
              </span>
              {score}% Match
            </span>
          ) : null}
          {badge ? (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {proseSections
          .filter((section) => Boolean(section.body))
          .map((section, index) => (
            <div
              key={section.key}
              className={index > 0 ? "border-t border-[#ece9fe] pt-5" : undefined}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                  <section.icon className="h-4 w-4 text-brand-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-primary">{section.title}</p>
                  <div
                    className={`mt-1 ${SECTION_BODY_CLASSES}`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body!) }}
                  />
                </div>
              </div>
            </div>
          ))}

        {questions.length > 0 ? (
          <div className="border-t border-[#ece9fe] pt-5">
            <ScreeningQuestionsSection questions={questions} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
