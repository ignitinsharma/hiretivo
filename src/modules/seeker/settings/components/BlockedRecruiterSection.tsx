"use client";

import { useProfileVisibility } from "../queries/use-profile-visibility";
import { ShieldOff } from "lucide-react";
import { format } from "date-fns";

/*
 * BlockedRecruiterSection
 * Lists currently blocked recruiter domains in engineer settings.
 * Read-only list — blocking happens in WhoViewedMeSection.
 * Shows empty state when no domains are blocked.
 */
export function BlockedRecruiterSection() {
  const { data, isLoading } = useProfileVisibility();
  const blocked = data?.blockedDomains ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-5">
        <div className="h-4 w-40 rounded bg-brand-surface animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-brand-foreground flex items-center gap-2">
          <ShieldOff className="h-4 w-4 text-brand-foreground-muted" />
          Blocked companies
        </h3>
        <p className="text-sm text-brand-foreground-muted mt-0.5">
          These companies cannot find you in the talent pool or access your profile.
        </p>
      </div>

      {blocked.length === 0 ? (
        <p className="text-sm text-brand-foreground-secondary">No companies blocked.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {blocked.map((entry) => (
            <div key={entry.domain} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
              <div>
                <p className="font-medium text-sm text-brand-foreground">{entry.domain}</p>
                <p className="text-xs text-brand-foreground-secondary">Blocked {format(new Date(entry.blockedAt), "MMM d, yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
