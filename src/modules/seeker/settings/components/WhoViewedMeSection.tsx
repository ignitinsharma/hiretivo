"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useProfileVisibility, useBlockRecruiter } from "../queries/use-profile-visibility";
import { Shield, Eye } from "lucide-react";

/*
 * WhoViewedMeSection
 * Lists recruiters who unlocked the engineer's profile.
 * Each entry shows company name, domain, unlock date, source, and a "Block this company" button.
 */
export function WhoViewedMeSection() {
  const { data, isLoading, isError } = useProfileVisibility();
  const { mutate: blockRecruiter, isPending: blocking } = useBlockRecruiter();
  const [blockedNow, setBlockedNow] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-5">
        <div className="h-4 w-32 rounded bg-brand-surface animate-pulse mb-3" />
        {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-brand-surface animate-pulse mb-2" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-5">
        <p className="text-sm text-brand-danger">Failed to load viewer history</p>
      </div>
    );
  }

  const viewers = data?.whoViewedMe ?? [];

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-brand-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-brand-foreground-muted" />
          Who viewed me
        </h3>
        <p className="text-sm text-brand-foreground-muted mt-0.5">
          Recruiters who unlocked your profile. You can block companies from finding you.
        </p>
      </div>

      {viewers.length === 0 ? (
        <p className="text-sm text-brand-foreground-secondary">No one has unlocked your profile yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {viewers.map((viewer, i) => {
            const isBlockedNow = blockedNow.has(viewer.companyDomain);
            return (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-brand-foreground truncate">{viewer.companyName}</p>
                  <p className="text-xs text-brand-foreground-secondary">
                    {viewer.source === "talent_pool" ? "Viewed in Talent Pool" : "Viewed application"} · {format(new Date(viewer.unlockedAt), "MMM d, yyyy")}
                  </p>
                </div>
                {isBlockedNow ? (
                  <span className="text-xs text-brand-foreground-secondary flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Blocked
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-brand-danger hover:bg-brand-danger/10"
                    disabled={blocking}
                    onClick={() => {
                      blockRecruiter(viewer.companyDomain, {
                        onSuccess: () => setBlockedNow((prev) => new Set(prev).add(viewer.companyDomain)),
                      });
                    }}
                  >
                    Block
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
