'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PlanTier } from '@/constants/enums';
import { PLAN_DISPLAY_NAMES } from '@/lib/billing/ai-daily-limit';
import { useCreditStatus } from '@/modules/seeker/dashboard/hooks/use-credit-status';

/*
 * CreditsBanner
 * Live "N credits left this month" banner for the seeker dashboard, wired to
 * GET /api/seeker/credits. Free plan shows plain remaining count; paid plans
 * show the plan name too. Zero remaining is emphasized in red with the
 * upgrade link foregrounded — the wizard hard-gates on this same count
 * (Section H), so the banner must never overstate what's left.
 */
export function CreditsBanner() {
  const { data: session } = useSession();
  const { data, isLoading, isError } = useCreditStatus();

  const plan = (session?.user?.plan as unknown as PlanTier | undefined) ?? PlanTier.FREE;
  const planLabel = PLAN_DISPLAY_NAMES[plan];
  const isPaidPlan = plan !== PlanTier.FREE;

  if (isLoading) {
    return <div className="mb-6 h-16 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />;
  }

  // Non-critical widget — an errored fetch shouldn't block the rest of the dashboard.
  if (isError || !data) {
    return null;
  }

  const isExhausted = data.remaining <= 0;
  const label = isPaidPlan
    ? `${planLabel} plan: ${data.remaining} of ${data.limit} credits remaining`
    : `${data.remaining} credit${data.remaining === 1 ? '' : 's'} left this month`;

  return (
    <div
      className={
        'mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ' +
        (isExhausted ? 'border-brand-danger/30 bg-brand-danger/5' : 'border-brand-border bg-brand-surface')
      }
    >
      <div className="flex items-center gap-2">
        <Zap className={'h-5 w-5 ' + (isExhausted ? 'text-brand-danger' : 'text-brand-primary')} />
        <span className={'text-sm font-medium ' + (isExhausted ? 'text-brand-danger' : 'text-brand-foreground')}>
          {isExhausted ? '0 credits left — upgrade to keep applying' : label}
        </span>
      </div>
      <Link
        href="/pricing"
        className={
          'text-sm font-semibold hover:underline ' + (isExhausted ? 'text-brand-danger' : 'text-brand-primary')
        }
      >
        {isExhausted ? 'Upgrade now' : 'View plans'}
      </Link>
    </div>
  );
}
