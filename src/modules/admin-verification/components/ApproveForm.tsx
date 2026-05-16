"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ApproveFormProps {
  engineerId: string;
  onCancel: () => void;
  onDone: () => void;
}

/*
 * ApproveForm
 * Submits an approval decision with a validated Hiretivo score.
 */
export function ApproveForm({
  engineerId,
  onCancel,
  onDone,
}: ApproveFormProps) {
  const [score, setScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const scoreNumber = Number.parseInt(score, 10);
    if (Number.isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 100) {
      setError("Score must be between 0 and 100.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/verification/${engineerId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVED", score: scoreNumber }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Approval failed.");
        return;
      }

      onDone();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="verification-score"
        className="block text-sm font-medium text-brand-foreground"
      >
        Hiretivo Score (0-100)
      </label>
      <input
        id="verification-score"
        type="number"
        min="0"
        max="100"
        value={score}
        onChange={(event) => setScore(event.target.value)}
        placeholder="72"
        className="h-10 w-full rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
      />
      {error && <p className="text-xs text-brand-danger">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!score}
          loading={isSubmitting}
          loadingText="Sending"
        >
          Send Approval
        </Button>
      </div>
    </div>
  );
}
