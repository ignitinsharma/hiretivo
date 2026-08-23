"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterDef {
  key: string;
  label: string;
  options?: string[];
}

const DEFAULT_FILTERS: FilterDef[] = [
  { key: "jobType", label: "Job type", options: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] },
  { key: "workType", label: "Workplace", options: ["REMOTE", "HYBRID", "ONSITE"] },
  { key: "locationClass", label: "Location", options: ["worldwide", "us-only", "emea", "india", "onsite"] },
  { key: "experienceLevel", label: "Experience", options: ["ENTRY", "MID", "SENIOR", "LEAD"] },
  { key: "visaSponsored", label: "Visa sponsored" },
];

/*
 * FilterChips
 * Shared filter chip bar used by Dashboard, Browse, and Tracker.
 * - Filters WITH options: dropdown menu; selecting sends actual enum value.
 * - Filters WITHOUT options: binary toggle.
 */
interface FilterChipsProps {
  filters?: FilterDef[];
  activeFilters?: Partial<Record<string, string | undefined>>;
  onFilterChange?: (key: string, value: string | undefined) => void;
}

function formatOptionLabel(value: string): string {
  return value.toLowerCase().replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FilterChips({ filters = DEFAULT_FILTERS, activeFilters = {}, onFilterChange }: FilterChipsProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map((filter) => {
        const activeValue = activeFilters[filter.key];
        const isActive = Boolean(activeValue);
        if (filter.options) {
          return (
            <Popover key={filter.key} open={openKey === filter.key} onOpenChange={(open) => setOpenKey(open ? filter.key : null)}>
              <PopoverTrigger asChild>
                <button className={cn("shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all duration-150", isActive ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-brand-foreground-muted border-brand-border hover:border-gray-300 hover:text-brand-foreground")}>
                  {isActive ? `${filter.label}: ${formatOptionLabel(activeValue!)}` : filter.label}
                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-1">
                {filter.options.map((opt) => (
                  <button key={opt} onClick={() => { onFilterChange?.(filter.key, activeValue === opt ? undefined : opt); setOpenKey(null); }} className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors", activeValue === opt ? "bg-brand-primary/10 font-semibold text-brand-primary" : "text-brand-foreground hover:bg-brand-surface")}>
                    {formatOptionLabel(opt)}
                    {activeValue === opt && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          );
        }
        return (
          <button key={filter.key} onClick={() => onFilterChange?.(filter.key, isActive ? undefined : filter.key)} className={cn("shrink-0 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all duration-150", isActive ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-brand-foreground-muted border-brand-border hover:border-gray-300 hover:text-brand-foreground")}>
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
