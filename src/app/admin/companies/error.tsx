"use client";

import { AdminErrorState } from "@/modules/admin/components/AdminErrorState";

/*
 * /admin/companies error boundary
 * Delegates to the shared AdminErrorState for the companies page query failure.
 *
 * @param error - the boundary error (logged by AdminErrorState).
 * @param reset - re-renders the route segment, retrying the failed query.
 */
export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminErrorState
      title="Could not load companies"
      message="Something went wrong fetching the companies list."
      error={error}
      reset={reset}
    />
  );
}
