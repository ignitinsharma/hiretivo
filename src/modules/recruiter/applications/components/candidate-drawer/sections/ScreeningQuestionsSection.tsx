"use client";

import { useState } from "react";

import { Check, Copy, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ScreeningQuestionsSectionProps {
  questions: string[];
}

/*
 * ScreeningQuestionsSection
 * Renders AI-generated screening questions as interactive cards inside the candidate insights panel.
 * Each card has a numbered badge, question text, and a per-card copy button.
 * A "Copy all" button formats all questions as a numbered list for pasting into notes/email.
 */
export function ScreeningQuestionsSection({ questions }: ScreeningQuestionsSectionProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  /*
   * copyQuestion
   * Copies a single question to clipboard and flashes a ✓ icon on the card for 1.5s.
   * @param question - question text to copy
   * @param idx      - card index driving the ✓ flash state
   */
  const copyQuestion = async (question: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(question);
      setCopiedIdx(idx);
      toast.success("Question copied.");
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error("Could not copy question.");
    }
  };

  /*
   * copyAll
   * Copies all questions as a numbered list ("1. Q\n2. Q\n3. Q") to clipboard.
   */
  const copyAll = async () => {
    try {
      const text = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      await navigator.clipboard.writeText(text);
      toast.success("All questions copied.");
    } catch {
      toast.error("Could not copy questions.");
    }
  };

  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
        <MessageSquareText className="h-4 w-4 text-brand-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-primary">Suggested screening questions</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAll}
            className="h-7 shrink-0 gap-1.5 px-2 text-xs text-brand-foreground-muted hover:text-brand-primary"
          >
            <Copy className="h-3 w-3" />
            Copy all
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {questions.map((question, idx) => (
            <div
              key={question}
              className="group flex items-start gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-primary text-xs font-semibold text-white">
                {idx + 1}
              </span>
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-brand-foreground">{question}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyQuestion(question, idx)}
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Copy question ${idx + 1}`}
              >
                {copiedIdx === idx ? (
                  <Check className="h-3.5 w-3.5 text-brand-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-brand-foreground-secondary" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
