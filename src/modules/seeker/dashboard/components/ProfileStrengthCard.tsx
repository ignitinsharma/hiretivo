import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ProfileStrengthSummary } from '../types/dashboard.types';

interface ProfileStrengthCardProps {
  profileStrength: ProfileStrengthSummary;
}

function strengthLabel(percentage: number): string {
  if (percentage >= 90) return 'Expert';
  if (percentage >= 70) return 'Strong';
  if (percentage >= 50) return 'Intermediate';
  if (percentage >= 30) return 'Basic';
  return 'Starter';
}

export function ProfileStrengthCard({
  profileStrength,
}: ProfileStrengthCardProps) {
  const { percentage, ctaLabel, ctaHref } = profileStrength;
  const label = strengthLabel(percentage);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-primary w-5 h-5" />
        <h3 className="font-bold text-slate-900">Profile Strength</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
            {label}
          </span>
          <span className="text-xs font-semibold text-primary">
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {ctaLabel !== 'Profile complete' && (
        <p className="text-slate-500 text-xs leading-loose mb-4">
          {ctaLabel} to improve your visibility to recruiters.
        </p>
      )}

      <Button
        variant="secondary"
        size="default"
        className="w-full font-bold text-sm rounded-lg transition-colors"
        asChild
      >
        <Link href={ctaHref}>
          {percentage >= 100 ? 'View Profile' : 'Improve Profile'}
        </Link>
      </Button>
    </div>
  );
}
