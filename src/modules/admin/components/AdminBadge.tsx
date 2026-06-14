interface AdminBadgeProps {
  label: string;
  /** Semantic border/bg/text classes from status-display maps. */
  className: string;
}

/*
 * AdminBadge
 * Small bordered status/plan pill shared across admin tables and the overview.
 * Borders + tint only (no shadow, no dark mode) per project styling rules.
 *
 * @param label - Human-readable text (e.g. "In review", "Growth").
 * @param className - Semantic color classes from VERIFICATION_STATUS_DISPLAY / PLAN_TIER_DISPLAY.
 */
export function AdminBadge({ label, className }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
