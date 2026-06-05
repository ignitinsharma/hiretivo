import type { ReactElement } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface HiretivoVerifiedBadgeProps {
  className?: string;
  variant?: "pill" | "inline" | "avatar";
  size?: "sm" | "md" | "lg" | "xl";
  compact?: boolean;
}

const AVATAR_BADGE_CLASSES: Record<
  NonNullable<HiretivoVerifiedBadgeProps["size"]>,
  string
> = {
  sm: "-bottom-0.5 -right-0.5 h-3.5 w-3.5 border-2",
  md: "-bottom-0.5 -right-0.5 h-4 w-4 border-2",
  lg: "-bottom-0.5 -right-0.5 h-5 w-5 border-2",
  xl: "bottom-1 right-1 h-6 w-6 border-2",
};

const AVATAR_CHECK_CLASSES: Record<
  NonNullable<HiretivoVerifiedBadgeProps["size"]>,
  string
> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

/*
 * HiretivoVerifiedBadge
 * Brand verification mark for seeker/talent profiles.
 */
export function HiretivoVerifiedBadge({
  className,
  variant = "pill",
  size = "md",
  compact = false,
}: HiretivoVerifiedBadgeProps): ReactElement {
  if (variant === "avatar") {
    return (
      <span
        className={cn(
          "pointer-events-none absolute z-10 inline-flex items-center justify-center rounded-full border-white bg-brand-primary text-white",
          AVATAR_BADGE_CLASSES[size],
          className,
        )}
        aria-label="Hiretivo verified profile"
        title="Hiretivo verified"
      >
        <Check
          className={cn("stroke-[3]", AVATAR_CHECK_CLASSES[size])}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (variant === "inline" || compact) {
    return (
      <span
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-primary text-white",
          className,
        )}
        aria-label="Hiretivo verified profile"
        title="Hiretivo verified"
      >
        <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary",
        className,
      )}
      aria-label="Hiretivo verified profile"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold leading-none text-white">
        H
      </span>
      {!compact ? <span>Hiretivo Verified</span> : null}
    </span>
  );
}
