import Link from 'next/link';

interface UnsubscribePageProps {
  searchParams: { success?: string; error?: string };
}

/*
 * UnsubscribePage
 * Shown after clicking the unsubscribe link in a digest email.
 * Displays success or error state based on ?success / ?error query param.
 * No auth required — accessible directly from email.
 */
export default function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const isError = searchParams.error === 'invalid';

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-brand-border p-8 text-center">

        {isError ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-bold text-2xl text-brand-foreground mb-3">Invalid link</h1>
            <p className="text-brand-foreground-muted mb-6">
              This unsubscribe link is invalid or has been tampered with. You can manage your email preferences directly from your dashboard.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-bold text-2xl text-brand-foreground mb-3">You&apos;re unsubscribed</h1>
            <p className="text-brand-foreground-muted mb-6">
              You won&apos;t receive weekly job digest emails anymore. You can re-enable them anytime from your dashboard settings.
            </p>
          </>
        )}

        <Link
          href="/seeker/dashboard"
          className="inline-block bg-brand-primary text-brand-primary-foreground font-semibold text-sm px-6 py-3 rounded-lg hover:bg-brand-primary-dk transition-colors"
        >
          Go to Dashboard
        </Link>

        <p className="mt-4 text-xs text-brand-foreground-secondary">
          Changed your mind?{' '}
          <Link href="/seeker/dashboard" className="text-brand-foreground-muted underline underline-offset-2">
            Re-enable job alerts
          </Link>
        </p>

      </div>
    </div>
  );
}
