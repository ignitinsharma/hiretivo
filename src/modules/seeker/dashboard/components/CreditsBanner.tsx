import Link from 'next/link';
import { Zap } from 'lucide-react';
import { FREE_AI_DAILY_LIMIT } from '@/lib/billing/ai-daily-limit';

/* CreditsBanner
 * Placeholder "credits left this month" display for the seeker dashboard. Phase 2 has no
 * real monthly credit ledger yet (that's Phase 8) — this reads the existing daily AI-quota
 * constant as a stand-in so the UI slot exists now and Phase 8 swaps in real consumption. */
export function CreditsBanner() {
  const count = FREE_AI_DAILY_LIMIT;

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-brand-border bg-brand-surface p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-brand-primary" />
        <span className="text-sm font-medium text-brand-foreground">
          {count != null ? `${count} credits left this month` : '— credits left this month'}
        </span>
      </div>
      <Link href="/pricing" className="text-sm font-semibold text-brand-primary hover:underline">
        View plans
      </Link>
    </div>
  );
}
