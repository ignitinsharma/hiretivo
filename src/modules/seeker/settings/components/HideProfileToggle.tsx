"use client";

import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { useHideProfile } from "../queries/use-profile-visibility";
import { EyeOff, Eye } from "lucide-react";

interface HideProfileToggleProps {
  hiddenUntil: string | null; // ISO string from user record
}

/*
 * HideProfileToggle
 * Toggle for "Hide my profile temporarily" in engineer settings.
 * hide=true: sets hiddenUntil = now + 30 days. hide=false: clears hiddenUntil.
 * When hidden: shows "Profile hidden until [date]" with "Make visible again" CTA.
 */
export function HideProfileToggle({ hiddenUntil }: HideProfileToggleProps) {
  const { mutate: hideProfile, isPending } = useHideProfile();

  const isHidden = hiddenUntil !== null && new Date(hiddenUntil) > new Date();
  const hiddenUntilDate = hiddenUntil ? new Date(hiddenUntil) : null;

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-brand-foreground flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-brand-foreground-muted" />
            Hide my profile temporarily
          </h3>
          <p className="text-sm text-brand-foreground-muted mt-0.5">
            Your profile will be removed from the talent pool and your public URL will return 404.
            Active applications and interviews continue normally.
          </p>
        </div>
      </div>

      {isHidden && hiddenUntilDate ? (
        <div className="flex flex-col gap-2 rounded-lg border border-brand-border bg-brand-surface p-3">
          <p className="text-sm font-medium text-brand-foreground flex items-center gap-1.5">
            <EyeOff className="h-3.5 w-3.5" />
            Hidden until {format(hiddenUntilDate, "MMM d, yyyy")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => hideProfile({ hide: false })}
            disabled={isPending}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Updating\u2026" : "Make profile visible again"}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start border border-brand-border"
          onClick={() => hideProfile({ hide: true })}
          disabled={isPending}
        >
          <EyeOff className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Hiding\u2026" : `Hide for 30 days (until ${format(addDays(new Date(), 30), "MMM d")})`}
        </Button>
      )}
    </div>
  );
}
