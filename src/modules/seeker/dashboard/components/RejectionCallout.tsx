import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/*
 * RejectionCallout
 * Inline dashboard callout rendered server-side for REJECTED verification status.
 * Only renders when status === 'REJECTED' — returns null for all other states.
 * Non-dismissible: disappears naturally when the engineer resubmits (status → PENDING).
 *
 * @param status - verificationStatus string from User model
 * @param verificationNotes - optional admin rejection notes from SeekerProfile model
 */

interface RejectionCalloutProps {
  status: string;
  verificationNotes: string | null;
}

export function RejectionCallout({ status, verificationNotes }: RejectionCalloutProps) {
  if (status !== 'REJECTED') return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-amber-900">Verification Not Approved</p>
          <p className="text-xs text-amber-800 leading-relaxed mt-1">
            {verificationNotes
              ? verificationNotes
              : 'Your profile needs updates before it can be approved. Update your profile and resubmit for review.'}
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-lg text-xs font-semibold shrink-0 self-start"
        asChild
      >
        <Link href="/seeker/onboarding">Update &amp; Resubmit →</Link>
      </Button>
    </div>
  );
}
