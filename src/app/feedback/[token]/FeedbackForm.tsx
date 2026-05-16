"use client";

import { useState } from "react";
import { Star, CheckCircle2, Loader2 } from "lucide-react";

interface FeedbackFormProps {
  token: string;
}

type FormState =
  | { status: "form" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; error: "expired" | "already_used" | "invalid_token" | "unknown" };

/*
 * FeedbackForm
 * Star picker (1-5) feedback form for employers.
 * Handles all 5 states: form, submitting, success, expired, already_used, invalid_token.
 * No auth required — gated by JWT token validity.
 */
export function FeedbackForm({ token }: FeedbackFormProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formState, setFormState] = useState<FormState>({ status: "form" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRating === 0) return;

    setFormState({ status: "submitting" });

    try {
      const res = await fetch("/api/feedback/employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating: selectedRating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFormState({ status: "success" });
        return;
      }

      const body = await res.json().catch(() => ({}));
      const error = body?.error as string;

      if (error === "expired") {
        setFormState({ status: "error", error: "expired" });
      } else if (error === "already_used") {
        setFormState({ status: "error", error: "already_used" });
      } else {
        setFormState({ status: "error", error: "invalid_token" });
      }
    } catch {
      setFormState({ status: "error", error: "invalid_token" });
    }
  }

  // Error states — show message without form
  if (formState.status === "error") {
    const messages: Record<string, { title: string; description: string }> = {
      expired: {
        title: "This feedback link has expired.",
        description: "Feedback links are valid for 90 days. Please contact the recruiter for a new link.",
      },
      already_used: {
        title: "Feedback already received — thank you.",
        description: "You have already submitted feedback for this request. Multiple submissions are not allowed.",
      },
      invalid_token: {
        title: "This feedback link is invalid.",
        description: "The link you followed is not valid. Please check the URL or contact the sender.",
      },
    };

    const msg = messages[formState.error] ?? messages.invalid_token;

    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-brand-border bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-brand-foreground">
            {msg.title}
          </h1>
          <p className="text-sm text-brand-foreground-muted">{msg.description}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (formState.status === "success") {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-brand-border bg-white p-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-brand-success" />
          <h1 className="mb-2 text-xl font-semibold text-brand-foreground">
            Thank you!
          </h1>
          <p className="text-sm text-brand-foreground-muted">
            Your feedback has been recorded. It will help us improve Hiretivo
            Score accuracy.
          </p>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-brand-border bg-white p-8">
      {/* Wordmark */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-brand-primary">Hiretivo</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Heading */}
        <div className="text-center">
          <h1 className="mb-1 text-2xl font-semibold text-brand-foreground">
            How did your hire do?
          </h1>
          <p className="text-sm text-brand-foreground-muted">
            Your feedback helps us improve Hiretivo Score accuracy.
          </p>
        </div>

        {/* Star picker */}
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || selectedRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-brand-border"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything to share about their performance? (optional)"
          className="h-24 w-full rounded-lg border border-brand-border p-3 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          maxLength={2000}
          aria-label="Feedback comment (optional)"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={selectedRating === 0 || formState.status === "submitting"}
          className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-primary-foreground transition-colors hover:bg-[#5a47d9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {formState.status === "submitting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </button>
      </form>
    </div>
  );
}
