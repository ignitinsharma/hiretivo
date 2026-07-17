"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";

/*
 * SearchBar
 * Shared search input with 400ms debounce, AbortController, and dedup.
 * Used by Dashboard, Browse, and Tracker.
 */
interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  showFilterButton?: boolean;
  onFilterToggle?: () => void;
}

export function SearchBar({
  value = "",
  onChange,
  placeholder = "Search by title, company, or keyword...",
  resultCount,
  showFilterButton = true,
  onFilterToggle,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const emitChange = useCallback(
    (val: string) => {
      if (val === lastEmittedRef.current) return;
      lastEmittedRef.current = val;

      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      onChange?.(val);
    },
    [onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      emitChange("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      emitChange(val);
    }, 400);
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl border border-brand-border px-4 py-2.5">
      {showFilterButton && (
        <button
          type="button"
          onClick={onFilterToggle}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-foreground-muted bg-brand-surface rounded-lg px-3 py-1.5 hover:bg-[#f3f4f6] transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
      )}
      <div className="flex-1 flex items-center gap-2 px-2">
        <Search className="w-4 h-4 text-brand-foreground-muted shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          className="flex-1 bg-transparent border-none outline-none text-sm text-brand-foreground placeholder:text-brand-foreground-secondary"
        />
        {localValue && (
          <button
            type="button"
            onClick={() => {
              setLocalValue("");
              emitChange("");
            }}
            className="p-0.5 rounded hover:bg-brand-surface transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-brand-foreground-muted" />
          </button>
        )}
      </div>
      {resultCount !== undefined && (
        <div className="flex items-center gap-1 text-xs text-brand-foreground-secondary border-l border-brand-border pl-3">
          <span className="font-medium text-brand-foreground-muted">{resultCount.toLocaleString()}</span>
          <span>jobs found</span>
        </div>
      )}
    </div>
  );
}
