"use client";

import { FitDetails } from "@/components/fit-details";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import type { PostingFit } from "@/lib/fit";

/** Optional fit score for a saved application's posting. */
export function ScoreCard({ fit, scoring, step, onScore }: { fit: PostingFit | null; scoring: boolean; step: string | null; onScore: () => void }) {
  return (
    <Card padding="none" className="flex flex-col gap-3 px-7 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-field font-medium">How well it fits</h3>
          <p className="text-meta text-muted">A score from 0 to 100 with the reasons, as Find jobs gives, from the scorer in Settings → Scoring.</p>
        </div>
        <Button variant="secondary" size="sm" aria-disabled={scoring || undefined} loading={scoring} onClick={() => !scoring && onScore()}>
          {scoring ? "Scoring…" : fit ? "Score it again" : "Score it"}
        </Button>
      </div>
      {scoring && (
        <p role="status" className="flex items-center gap-2 text-meta text-muted">
          <Spinner />
          {step ?? "Starting…"}
        </p>
      )}
      {fit && !scoring && <FitDetails fit={fit} />}
    </Card>
  );
}
