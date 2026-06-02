import Link from 'next/link';
import { AlertCircle, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/*
 * VerificationStatusCard
 * Displays the seeker's Hiretivo verification status in the dashboard sidebar.
 * Renders one of four states: NOT_SUBMITTED (amber), PENDING/IN_REVIEW (blue),
 * VERIFIED (green), or REJECTED (red). Each state shows an icon, heading, body
 * text, and an optional CTA button linking to /seeker/onboarding.
 *
 * @param status - VerificationStatus string value from the API
 * @param verificationNotes - Optional rejection notes shown in REJECTED state
 */

interface VerificationStatusCardProps {
  status: string;
  verificationNotes?: string | null;
}

export function VerificationStatusCard({
  status,
  verificationNotes,
}: VerificationStatusCardProps) {
  if (status === 'VERIFIED') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <h3 className="font-semibold text-sm text-green-900">
            Hiretivo Verified ✓
          </h3>
        </div>
        <p className="text-xs text-green-800 leading-relaxed">
          You&apos;re visible to recruiters in the talent pool.
        </p>
      </div>
    );
  }

  if (status === 'PENDING' || status === 'IN_REVIEW') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="font-semibold text-sm text-blue-900">Under Review</h3>
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          Your profile is being reviewed by our team. We&apos;ll email you within 48
          hours.
        </p>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-brand-danger shrink-0" />
          <h3 className="font-semibold text-sm text-red-900">
            Verification Rejected
          </h3>
        </div>
        <p className="text-xs text-red-800 leading-relaxed">
          {verificationNotes
            ? verificationNotes
            : 'Your profile needs updates before it can be approved.'}
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="w-full rounded-lg text-xs font-semibold"
          asChild
        >
          <Link href="/seeker/onboarding">Update &amp; Resubmit →</Link>
        </Button>
      </div>
    );
  }

  // NOT_SUBMITTED (default / fallback)
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <h3 className="font-semibold text-sm text-amber-900">
          Get Hiretivo Verified
        </h3>
      </div>
      <p className="text-xs text-amber-800 leading-relaxed">
        Verified engineers are visible to recruiters. Unverified profiles are
        hidden from the talent pool.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="w-full rounded-lg text-xs font-semibold"
        asChild
      >
        <Link href="/seeker/onboarding">Finish profile →</Link>
      </Button>
    </div>
  );
}
