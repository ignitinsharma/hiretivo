"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface FilterDef {
  key: string;
  label: string;
  options?: string[];
}

const DEFAULT_FILTERS: FilterDef[] = [
  { key: "jobType", label: "Job type", options: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] },
  { key: "workType", label: "Workplace", options: ["REMOTE", "HYBRID", "ONSITE"] },
  { key: "locationClass", label: "Location", options: ["worldwide", "us-only", "emea", "india", "onsite"] },
];

/*
 * FilterChips
 * Shared filter chip bar used by Dashboard, Browse, and Tracker.
 * Each chip toggles a filter on/off.
 */
interface FilterChipsProps {
  filters?: Array<{ key: string; label: string; options?: string[] }>;
  activeFilters?: Partial<Record<string, string | undefined>>;
  onFilterChange?: (key: string, value: string | undefined) => void;
}

export function FilterChips({
  filters = DEFAULT_FILTERS,
  activeFilters = {},
  onFilterChange,
}: FilterChipsProps) {
  const handleClick = (key: string) => {
    const currentValue = activeFilters[key];
    const newValue = currentValue ? undefined : key;
    onFilterChange?.(key, newValue);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => handleClick(filter.key)}
          className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-lg border transition-all duration-150 ${
            activeFilters[filter.key]
              ? "bg-brand-primary text-white border-brand-primary"
              : "bg-white text-brand-foreground-muted border-brand-border hover:border-gray-300 hover:text-brand-foreground"
          }`}
        >
          {filter.label}
          <svg className="w-3 h-3 inline-block ml-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ))}
    </div>
  );
}
