"use client";

import { useEffect } from "react";

interface AdminErrorStateProps {
  title: string;
  message: string;
  error: Error & { digest?: string };
  reset: () => void;
}

/*
 * AdminErrorState
 * Shared brand-token error boundary UI for admin route segments (isError state per
 * CLAUDE.md). Logs the error digest via console.error per the Next.js error.tsx contract.
 *
 * @param title - heading describing what failed to load.
 * @param message - supporting copy under the heading.
 * @param error - the boundary error (logged for diagnostics).
 * @param reset - re-renders the route segment, retrying the failed query.
 */
export function AdminErrorState({
  title,
  message,
  error,
  reset,
}: AdminErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-10 text-center">
      <h2 className="font-semibold text-xl text-brand-foreground">{title}</h2>
      <p className="mt-2 text-sm text-brand-foreground-muted">{message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 inline-flex items-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-primary-foreground hover:bg-brand-primary-dark"
      >
        Try again
      </button>
    </div>
  );
}
