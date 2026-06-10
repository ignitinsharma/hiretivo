import { ChevronRight, Sparkles } from "lucide-react";

import { sanitizeHtml } from "@/lib/utils/html-sanitizer";
import type { AiState } from "../types";
import { getFitBadge } from "../utils";

interface AiInsightsCardProps {
  state: AiState;
}

const HERO_GRADIENT =
  "bg-[radial-gradient(120%_130%_at_82%_0%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_44%),linear-gradient(108deg,#4f46e5_0%,#7560ff_42%,#8b83f8_100%)]";

export function AiInsightsCard({ state }: AiInsightsCardProps) {
  if (state.isPlanGated) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
            <Sparkles className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              AI Candidate Insights require a Pro plan
            </p>
            <a
              href="/recruiter/settings?tab=billing"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"
            >
              Upgrade now
              <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (state.isError && state.errorMessage === "PLAN_GATED") {
    return (
      <section className="h-fit self-start rounded-xl border border-brand-border bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">Daily free limit reached</p>
            <p className="mt-1 text-sm text-white/80">
              You have used all 3 of today&apos;s free AI candidate summaries. Upgrade to Pro for unlimited AI insights, interview scheduling, and more.
            </p>
          </div>
          <a
            href="/recruiter/settings?tab=billing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-white/90"
          >
            Upgrade to Pro
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    );
  }

  if (state.isPending) {
    return (
      <section className={`h-fit self-start rounded-xl border border-brand-border p-5 ${HERO_GRADIENT}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-44 rounded bg-white/30" />
          <div className="h-3 w-full rounded bg-white/25" />
          <div className="h-3 w-5/6 rounded bg-white/25" />
        </div>
      </section>
    );
  }

  if (state.isError && state.errorMessage !== "PLAN_GATED") return null;
  if (!state.summary) return null;

  const badge = state.fitLevel ? getFitBadge(state.fitLevel) : null;
  const score = state.fitScore ?? 0;

  return (
    <section className={`h-fit self-start rounded-xl border border-brand-border p-5 text-white ${HERO_GRADIENT}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4" />
            AI Candidate Insights
          </p>
          <div
            className="mt-3 text-sm leading-relaxed text-white/90 [&_.summary-container]:space-y-2 [&_.summary-skills_mark]:rounded [&_.summary-skills_mark]:bg-white/15 [&_.summary-skills_mark]:px-1 [&_.summary-verdict]:mb-3 [&_.summary-verdict]:border-l-2 [&_.summary-verdict]:border-white/40 [&_.summary-verdict]:pl-2.5 [&_.screening-questions]:mt-4 [&_.screening-questions]:border-t [&_.screening-questions]:border-white/15 [&_.screening-questions]:pt-3 [&_.screening-questions_h3]:text-xs [&_.screening-questions_h3]:font-semibold [&_.screening-questions_h3]:uppercase [&_.screening-questions_h3]:tracking-wider [&_.screening-questions_h3]:text-white/70 [&_.screening-questions_ol]:mt-2 [&_.screening-questions_ol]:list-decimal [&_.screening-questions_ol]:space-y-1.5 [&_.screening-questions_ol]:pl-5 [&_.summary-gaps_em]:text-white"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(state.summary) }}
          />
        </div>
        <div className="space-y-2 text-right">
          {score > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} />
              </div>
              <span className="text-xs font-semibold">{score}%</span>
            </div>
          ) : null}
          {badge ? (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
