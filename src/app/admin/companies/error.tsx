"use client";

/*
 * /admin/companies error boundary
 * Renders a brand-token error state with a retry action when the companies
 * page query fails (isError state per CLAUDE.md). Client Component per the
 * Next.js error.tsx contract.
 *
 * @param reset - Re-renders the route segment, retrying the failed query.
 */
export default function CompaniesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-10 text-center">
      <h2 className="font-semibold text-xl text-brand-foreground">
        Could not load companies
      </h2>
      <p className="mt-2 text-sm text-brand-foreground-muted">
        Something went wrong fetching the companies list.
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 inline-flex items-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground hover:bg-brand-primary-dark"
      >
        Try again
      </button>
    </div>
  );
}
