"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { TalentFilters as TalentFiltersType } from "../types/talent.types";

interface TalentFiltersProps {
  filters: TalentFiltersType;
  onChange: (filters: TalentFiltersType) => void;
}

/*
 * TalentFilters
 * Filter bar for talent pool browse page.
 * Controlled: parent holds filter state and passes onChange callback.
 */
export function TalentFilters({ filters, onChange }: TalentFiltersProps) {
  const [local, setLocal] = useState<TalentFiltersType>(filters);

  const apply = useCallback(() => onChange(local), [local, onChange]);
  const reset = useCallback(() => { setLocal({}); onChange({}); }, [onChange]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-4 lg:flex-row lg:items-end lg:flex-wrap">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <label className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Skills</label>
        <input
          type="text"
          placeholder="e.g. React, TypeScript"
          value={local.skills ?? ""}
          onChange={(e) => setLocal((p) => ({ ...p, skills: e.target.value || undefined }))}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <label className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Role</label>
        <input
          type="text"
          placeholder="e.g. Backend Engineer"
          value={local.role ?? ""}
          onChange={(e) => setLocal((p) => ({ ...p, role: e.target.value || undefined }))}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Max Salary (USD/yr)</label>
        <input
          type="number"
          placeholder="200000"
          value={local.salaryMax ?? ""}
          onChange={(e) => setLocal((p) => ({ ...p, salaryMax: e.target.value ? Number(e.target.value) : undefined }))}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground w-36 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">Min Live Overlap</label>
        <input
          type="number"
          min={0} max={16}
          placeholder="4"
          value={local.timezoneOverlapMin ?? ""}
          onChange={(e) => setLocal((p) => ({ ...p, timezoneOverlapMin: e.target.value ? Number(e.target.value) : undefined }))}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground w-28 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={apply}>Apply Filters</Button>
        <Button variant="ghost" size="sm" onClick={reset}>Clear</Button>
      </div>
    </div>
  );
}
