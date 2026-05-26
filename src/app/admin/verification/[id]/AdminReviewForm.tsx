"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { REJECTION_REASONS } from "@/constants/verification-reasons";
import type { GithubAnalysisOutput } from "@/lib/ai-prompts";
import {
  calculateVerificationRubricTotal,
  createRubricFromAiScore,
  VERIFICATION_RUBRIC,
} from "@/lib/verification/rubric";

/*
 * AdminReviewForm
 * Form with AI pre-fill, override capture, and aiSummary logging.
 * Pre-fills decision radio, score, and rejection reasons from AI output.
 * Shows override reason input when admin changes AI recommendation.
 * Posts to /api/admin/verification/[id]/review.
 */

interface AdminReviewFormProps {
  engineerId: string;
  reviewId: string;
  aiOutput: GithubAnalysisOutput | null; // null = AI unavailable
  aiSummaryMeta: {
    model: string;
    promptVersion: string;
    inputSnapshot: object;
  } | null;
}

const reviewFormSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    scoreGiven: z.number().int().min(0).max(100),
    rubricScores: z.record(z.string(), z.number().int().min(0).max(30)),
    reasons: z.array(z.string()),
    notes: z.string().max(2000).optional(),
    overrideReason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.decision === "REJECTED") {
        return data.reasons.length > 0;
      }
      return true;
    },
    { message: "Select at least one rejection reason", path: ["reasons"] },
  )
  .refine(
    (data) => {
      if (data.decision !== "REJECTED" || !data.reasons.includes("other")) {
        return true;
      }
      return Boolean(data.notes?.trim());
    },
    { message: "Custom note is required when Other is selected", path: ["notes"] },
  );

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

function getRubricDefaults(aiOutput: GithubAnalysisOutput | null) {
  return aiOutput?.rubricScores ?? createRubricFromAiScore(aiOutput?.scoreSuggestion);
}

function getDecisionDefault(aiOutput: GithubAnalysisOutput | null): "APPROVED" | "REJECTED" {
  if (!aiOutput) return "APPROVED";
  return aiOutput.recommendation === "APPROVE" ? "APPROVED" : "REJECTED";
}

export function AdminReviewForm({
  engineerId,
  aiOutput,
  aiSummaryMeta,
}: AdminReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [initialDecision, setInitialDecision] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      decision: getDecisionDefault(aiOutput),
      scoreGiven: aiOutput?.scoreSuggestion ?? 0,
      rubricScores: getRubricDefaults(aiOutput),
      reasons: aiOutput?.reasons ?? [],
      notes: "",
      overrideReason: "",
    },
  });

  const watchedDecision = form.watch("decision");
  const watchedRubricScores = form.watch("rubricScores");
  const rubricTotal = calculateVerificationRubricTotal(watchedRubricScores);

  // Show override input when admin changes the AI-recommended decision
  useEffect(() => {
    if (initialDecision && watchedDecision && watchedDecision !== initialDecision) {
      setShowOverrideInput(true);
    }
  }, [watchedDecision, initialDecision]);

  // Set initial AI decision on mount
  useEffect(() => {
    if (aiOutput) {
      const mapped = getDecisionDefault(aiOutput);
      setInitialDecision(mapped);
      form.reset({
        decision: mapped,
        scoreGiven: aiOutput.scoreSuggestion,
        rubricScores: getRubricDefaults(aiOutput),
        reasons: aiOutput.reasons,
        notes: "",
        overrideReason: "",
      });
    }
  }, [aiOutput, form]);

  async function onSubmit(data: ReviewFormValues) {
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        decision: data.decision,
        score: data.decision === "APPROVED" ? rubricTotal : undefined,
        rubricScores: data.rubricScores,
        reasons:
          data.decision === "REJECTED" ? data.reasons : undefined,
        customNote: data.notes?.trim() || undefined,
        reapplyDays: data.decision === "REJECTED" ? 30 : undefined,
      };

      // Include overrideReason when admin deviates from AI
      if (showOverrideInput && data.overrideReason?.trim()) {
        body.overrideReason = data.overrideReason.trim();
      }

      // Include aiSummary if AI data is available
      if (aiOutput && aiSummaryMeta) {
        body.aiSummary = {
          model: aiSummaryMeta.model,
          promptVersion: aiSummaryMeta.promptVersion,
          inputSnapshot: aiSummaryMeta.inputSnapshot,
          output: {
            recommendation: aiOutput.recommendation,
            confidence: aiOutput.confidence,
            scoreSuggestion: aiOutput.scoreSuggestion,
            reasons: aiOutput.reasons,
            summary: aiOutput.summary,
            rubricScores: data.rubricScores,
            strengthLevel: aiOutput.strengthLevel,
            strengths: aiOutput.strengths,
            gaps: aiOutput.gaps,
          },
          overrideReason: showOverrideInput
            ? data.overrideReason?.trim() || undefined
            : undefined,
        };
      }

      const response = await fetch(
        `/api/admin/verification/${engineerId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const result = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        toast.error(result.error ?? "Review submission failed");
        return;
      }

      toast.success("Review submitted successfully");
      window.location.reload();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasAiDraft = aiOutput !== null;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-xl border border-brand-border bg-white p-6"
    >
      <p className="mb-4 text-sm font-semibold text-brand-foreground">
        Review Decision
      </p>

      {/* Decision radio */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-brand-foreground">
          Decision
          {hasAiDraft && (
            <span className="ml-2 rounded bg-brand-primary/10 px-2 py-0.5 text-xs text-brand-primary">
              AI Draft
            </span>
          )}
        </legend>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value="APPROVED"
              checked={watchedDecision === "APPROVED"}
              onChange={() => form.setValue("decision", "APPROVED")}
              className="accent-brand-primary"
            />
            <span className="text-sm text-brand-foreground">Approve</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value="REJECTED"
              checked={watchedDecision === "REJECTED"}
              onChange={() => form.setValue("decision", "REJECTED")}
              className="accent-brand-primary"
            />
            <span className="text-sm text-brand-foreground">Reject</span>
          </label>
        </div>
        {form.formState.errors.decision && (
          <p className="mt-1 text-xs text-brand-danger">
            {form.formState.errors.decision.message}
          </p>
        )}
      </fieldset>

      {/* Score input */}
      <div className="mb-4">
        <label
          htmlFor="review-score"
          className="mb-1 flex items-center gap-2 text-sm font-medium text-brand-foreground"
        >
          Hiretivo Score (0-100)
          {hasAiDraft && (
            <span className="rounded bg-brand-primary/10 px-2 py-0.5 text-xs text-brand-primary">
              AI Draft
            </span>
          )}
        </label>
        <input
          id="review-score"
          type="number"
          min={0}
          max={100}
          {...form.register("scoreGiven", { valueAsNumber: true })}
          placeholder="72"
          className="h-10 w-full rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        <p className="mt-1 text-xs text-brand-foreground-muted">
          Final score is calculated from the editable rubric below: {rubricTotal}/100.
        </p>
        {form.formState.errors.scoreGiven && (
          <p className="mt-1 text-xs text-brand-danger">
            {form.formState.errors.scoreGiven.message}
          </p>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-brand-border bg-brand-surface p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-brand-foreground">
            100-point rubric
          </p>
          <p className="text-xs text-brand-foreground-muted">
            AI pre-fills these when available. If AI fails, score manually here.
          </p>
        </div>
        <div className="space-y-3">
          {VERIFICATION_RUBRIC.map((item) => (
            <label
              key={item.key}
              className="grid gap-1 text-sm text-brand-foreground sm:grid-cols-[1fr_88px]"
            >
              <span>
                {item.label}{" "}
                <span className="text-brand-foreground-muted">/{item.max}</span>
              </span>
              <input
                type="number"
                min={0}
                max={item.max}
                {...form.register(`rubricScores.${item.key}` as const, {
                  valueAsNumber: true,
                  onChange: () => {
                    window.setTimeout(() => {
                      form.setValue(
                        "scoreGiven",
                        calculateVerificationRubricTotal(
                          form.getValues("rubricScores"),
                        ),
                      );
                    }, 0);
                  },
                })}
                className="h-9 rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Rejection reasons (visible only when REJECTED) */}
      {watchedDecision === "REJECTED" && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-brand-foreground">
            Rejection Reasons
          </p>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-brand-border p-2">
            {REJECTION_REASONS.map((reason) => (
              <label
                key={reason.key}
                className="flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors hover:bg-brand-surface"
              >
                <input
                  type="checkbox"
                  value={reason.key}
                  checked={form.watch("reasons").includes(reason.key)}
                  onChange={(e) => {
                    const current = form.getValues("reasons");
                    if (e.target.checked) {
                      form.setValue("reasons", [...current, reason.key]);
                    } else {
                      form.setValue(
                        "reasons",
                        current.filter((r) => r !== reason.key),
                      );
                    }
                  }}
                  className="mt-0.5 accent-brand-primary"
                />
                <span className="text-sm text-brand-foreground">
                  {reason.label}
                </span>
              </label>
            ))}
          </div>
          {form.formState.errors.reasons && (
            <p className="mt-1 text-xs text-brand-danger">
              {form.formState.errors.reasons.message}
            </p>
          )}
          {form.watch("reasons").includes("other") && (
            <p className="mt-2 text-xs text-brand-foreground-muted">
              Add the custom explanation in notes. It is required for Other.
            </p>
          )}
        </div>
      )}

      {/* Notes textarea */}
      <div className="mb-4">
        <label
          htmlFor="review-notes"
          className="mb-1 block text-sm font-medium text-brand-foreground"
        >
          Notes (optional)
        </label>
        <textarea
          id="review-notes"
          rows={3}
          placeholder={
            form.watch("reasons").includes("other")
              ? "Custom note required for Other"
              : "Additional notes for this review"
          }
          className="w-full resize-none rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          {...form.register("notes")}
        />
      </div>

      {/* Override reason input (shown when admin changes AI decision) */}
      {showOverrideInput && (
        <div className="mb-4">
          <label
            htmlFor="review-override"
            className="mb-1 block text-sm font-medium text-brand-foreground"
          >
            Override reason (optional):
          </label>
          <textarea
            id="review-override"
            rows={2}
            placeholder="Why are you overriding the AI recommendation?"
            className="w-full resize-none rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            {...form.register("overrideReason")}
          />
          <p className="mt-1 text-xs text-brand-foreground-muted">
            This will be stored in the AI summary audit trail.
          </p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant={watchedDecision === "REJECTED" ? "destructive" : "primary"}
          size="sm"
          disabled={
            isSubmitting ||
            (watchedDecision === "REJECTED" &&
              form.watch("reasons").length === 0)
          }
          loading={isSubmitting}
          loadingText="Submitting"
        >
          {watchedDecision === "APPROVED" ? "Approve" : "Reject"}
        </Button>
      </div>
    </form>
  );
}
