"use client";

import { SavedEngineerCard } from "@/modules/recruiter/talent/components/SavedEngineerCard";
import { useSavedEngineers } from "@/modules/recruiter/talent/queries/use-saved-engineers";

/*
 * SavedEngineersList
 * Client component that loads and renders saved engineers.
 */
export function SavedEngineersList() {
  const { data: engineers, isLoading, isError } = useSavedEngineers();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-brand-border bg-brand-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6 text-center">
        <p className="text-brand-danger font-medium">Failed to load saved engineers</p>
        <p className="text-sm text-brand-foreground-muted mt-1">Please refresh the page</p>
      </div>
    );
  }

  if (!engineers || engineers.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center">
        <p className="font-semibold text-brand-foreground">No saved engineers yet</p>
        <p className="text-sm text-brand-foreground-muted mt-1">
          Browse the talent pool and save engineers you&apos;re interested in
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {engineers.map((eng) => (
        <SavedEngineerCard key={eng.id} engineer={eng} />
      ))}
    </div>
  );
}
