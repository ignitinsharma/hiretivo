'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { billingService } from '@/services/billing.service';

interface BoostJobButtonProps {
  jobId: string;
  /** true if an active BoostedJob exists for this job (passed from server component) */
  isAlreadyBoosted: boolean;
  /** ISO string of expiresAt, null if not boosted */
  boostExpiresAt: string | null;
}

const BOOST_FEATURES = [
  'Pinned at top of matched seeker feeds',
  'Active for 7 days',
  'One-time payment — no subscription',
] as const;

function formatBoostExpiry(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BoostJobButton({ jobId, isAlreadyBoosted, boostExpiresAt }: BoostJobButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBoost = async () => {
    setIsLoading(true);
    try {
      const url = await billingService.createBoostCheckoutSession(jobId);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start boost. Try again.');
      setIsLoading(false);
    }
  };

  if (isAlreadyBoosted && boostExpiresAt) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-primary">
            Boosted — active until {formatBoostExpiry(boostExpiresAt)}
          </p>
        </div>
        <Button disabled className="w-full" variant="default">
          Extend Boost
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-500" aria-hidden="true" />
          Boost this Job
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Pin at the top of matched seeker feeds for 7 days — $9 one-time.
        </p>
      </div>
      <ul className="space-y-1">
        {BOOST_FEATURES.map((feature) => (
          <li key={feature} className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="text-primary" aria-hidden="true">✓</span> {feature}
          </li>
        ))}
      </ul>
      <Button
        onClick={handleBoost}
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold"
        aria-label="Boost this job listing"
      >
        {isLoading ? 'Redirecting...' : 'Boost for $9'}
      </Button>
    </div>
  );
}
