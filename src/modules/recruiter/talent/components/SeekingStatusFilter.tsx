"use client";

import { SeekingStatus } from "@/constants/enums";

/*
 * CHIP_OPTIONS
 * Filter chip options for the talent pool seeking-status filter row.
 * NOT_LOOKING is intentionally excluded per CONTEXT.md decision 5 — recruiters
 * see NOT_LOOKING engineers in the "All" view but cannot specifically filter for them.
 * `value: null` means "no filter" (default).
 */
const CHIP_OPTIONS: ReadonlyArray<{
  value: SeekingStatus | null;
  label: string;
  dotClass: string | null;
}> = [
  { value: null, label: "All", dotClass: null },
  { value: SeekingStatus.ACTIVELY_LOOKING, label: "Actively Looking", dotClass: "bg-brand-success" },
  { value: SeekingStatus.OPEN_TO_OFFERS, label: "Open to Offers", dotClass: "bg-yellow-400" },
];

interface SeekingStatusFilterProps {
  value: SeekingStatus | undefined;
  onChange: (next: SeekingStatus | undefined) => void;
}

/*
 * SeekingStatusFilter
 * Renders a chip row letting the recruiter filter the talent pool by engineer
 * seeking status. Controlled: parent holds filter state and passes onChange.
 * `value: undefined` (or "All" selected) → no filter applied to the API call.
 */
export function SeekingStatusFilter({ value, onChange }: SeekingStatusFilterProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
        Availability
      </span>
      <div role="radiogroup" aria-label="Filter by seeking status" className="flex flex-wrap gap-2">
        {CHIP_OPTIONS.map((opt) => {
          const isSelected = (opt.value ?? undefined) === value;
          return (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value ?? undefined)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 text-brand-foreground"
                  : "border-brand-border bg-white text-brand-foreground-muted hover:bg-brand-surface"
              }`}
            >
              {opt.dotClass && (
                <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} aria-hidden="true" />
              )}
              <span className="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
