import { AlertTriangle } from 'lucide-react';
import { LOW_MATCH_THRESHOLD } from '@/modules/seeker/feed/constants/feed-thresholds';

interface CreditWarningProps {
  score: number;
}

/* CreditWarning
 * Inline nudge shown on low-match feed cards before Apply — a wizard run will
 * eventually spend an AI credit (Phase 8), so warn the seeker on a long-shot match.
 * Renders null when the score already clears LOW_MATCH_THRESHOLD.
 * @param score - job match percentage (0-100) */
export function CreditWarning({ score }: CreditWarningProps) {
  if (score >= LOW_MATCH_THRESHOLD) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Low match — applying here spends a credit on a long-shot. Consider a stronger match first.</span>
    </div>
  );
}
