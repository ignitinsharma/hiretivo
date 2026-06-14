"use client";

import { AdminErrorState } from "@/modules/admin/components/AdminErrorState";

/*
 * /admin overview error boundary
 * Delegates to the shared AdminErrorState for the overview stats query failure.
 *
 * @param error - the boundary error (logged by AdminErrorState).
 * @param reset - re-renders the route segment, retrying the failed query.
 */
export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminErrorState
      title="Could not load overview"
      message="Something went wrong loading the dashboard stats."
      error={error}
      reset={reset}
    />
  );
}
