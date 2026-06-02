"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface VerificationReviewFormProps {
  userId: string;
}

/*
 * VerificationReviewForm
 * Client form for admin to approve or reject an engineer's verification request.
 * POSTs to /api/admin/verification/[id]/review and redirects to the queue on success.
 * @param userId - The seeker's user ID being reviewed
 */
export function VerificationReviewForm({ userId }: VerificationReviewFormProps) {
  const router = useRouter();
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action) {
      setError("Please select Approve or Reject.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/verification/${userId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin/verification");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted mb-2">
          Decision
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAction("APPROVE")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              action === "APPROVE"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-brand-border bg-white text-brand-foreground hover:border-green-400"
            }`}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setAction("REJECT")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              action === "REJECT"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-brand-border bg-white text-brand-foreground hover:border-red-400"
            }`}
          >
            Reject
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="review-notes"
          className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted block mb-1"
        >
          Notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add reviewer notes visible to the engineer..."
          rows={4}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-brand-danger" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || !action}
        className="w-full"
      >
        {isSubmitting ? "Submitting…" : action === "APPROVE" ? "Approve Engineer" : action === "REJECT" ? "Reject Engineer" : "Submit Decision"}
      </Button>
    </form>
  );
}
