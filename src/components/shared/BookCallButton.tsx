"use client";

import { useEffect, useRef } from "react";
import { getCalApi } from "@calcom/embed-react";
import { CalendarDays } from "lucide-react";

type CalApi = Awaited<ReturnType<typeof getCalApi>>;

interface BookCallButtonProps {
  variant: "footer" | "nav" | "mobile";
}

/*
 * BookCallButton
 * Opens a Cal.com booking popup (cal.com/ignitinsharma) on click.
 * Stores the Cal API instance in a ref and calls cal("modal") directly —
 * data-cal-* attribute binding is unreliable with the namespaced getCalApi.
 * @param variant - Controls visual style: "footer" for dark footer link,
 *                  "nav" for desktop navbar ghost button,
 *                  "mobile" for hamburger menu item.
 */
export function BookCallButton({ variant }: BookCallButtonProps) {
  const calRef = useRef<CalApi | null>(null);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "ignitinsharma" });
      cal("ui", { hideEventTypeDetails: false });
      calRef.current = cal;
    })();
  }, []);

  /* Opens the Cal modal — requires the API to be initialized first. */
  function handleClick() {
    calRef.current?.("modal", { calLink: "ignitinsharma/30min" });
  }

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer"
        aria-label="Book a call with the founder"
      >
        <CalendarDays className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Talk to Founder
      </button>
    );
  }

  if (variant === "nav") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="hidden h-11 cursor-pointer items-center gap-2 rounded-2xl border border-brand-border px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-surface lg:inline-flex xl:h-12 xl:px-6 xl:text-base"
        aria-label="Book a call with the founder"
      >
        <CalendarDays className="w-4 h-4 shrink-0" aria-hidden="true" />
        Talk to Founder
      </button>
    );
  }

  /* mobile variant */
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full cursor-pointer gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-brand-surface"
      aria-label="Book a call with the founder"
    >
      <CalendarDays
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
      />
      <span>
        <span className="block text-sm font-semibold text-brand-foreground">
          Talk to Founder
        </span>
        <span className="mt-0.5 block text-xs text-brand-foreground-muted">
          Schedule a 1:1 with the founder
        </span>
      </span>
    </button>
  );
}
