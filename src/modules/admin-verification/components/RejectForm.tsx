"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { REJECTION_REASONS } from "@/constants/verification-reasons";

interface RejectFormProps {
  engineerId: string;
  onCancel: () => void;
  onDone: () => void;
}

/*
 * RejectForm
 * Submits rejection reasons, optional note, and the selected reapply window.
 */
export function RejectForm({ engineerId, onCancel, onDone }: RejectFormProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [reapplyDays, setReapplyDays] = useState<30 | 60 | 90>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleReason(key: string) {
    setSelectedReasons((current) =>
      current.includes(key)
        ? current.filter((reason) => reason !== key)
        : [...current, key],
    );
  }

  async function handleSubmit() {
    if (selectedReasons.length === 0) {
      setError("Select at least one rejection reason.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/verification/${engineerId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "REJECTED",
          reasons: selectedReasons,
          customNote: customNote.trim() || undefined,
          reapplyDays,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Rejection failed.");
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
    <div className="space-y-4">
      <div>
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
                checked={selectedReasons.includes(reason.key)}
                onChange={() => toggleReason(reason.key)}
                className="mt-0.5 accent-brand-primary"
              />
              <span className="text-sm text-brand-foreground">{reason.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="verification-note"
          className="mb-1 block text-sm font-medium text-brand-foreground"
        >
          Custom Note (optional)
        </label>
        <textarea
          id="verification-note"
          value={customNote}
          onChange={(event) => setCustomNote(event.target.value)}
          rows={3}
          placeholder="Specific feedback for this engineer"
          className="w-full resize-none rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-foreground">
          Reapply Window
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([30, 60, 90] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setReapplyDays(days)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                reapplyDays === days
                  ? "border-brand-primary bg-brand-primary text-brand-primary-foreground"
                  : "border-brand-border bg-white text-brand-foreground hover:bg-brand-surface"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

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
          variant="destructive"
          size="sm"
          onClick={handleSubmit}
          disabled={selectedReasons.length === 0}
          loading={isSubmitting}
          loadingText="Sending"
        >
          Send Rejection
        </Button>
      </div>
    </div>
  );
}
