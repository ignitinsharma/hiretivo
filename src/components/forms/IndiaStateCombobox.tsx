"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { INDIA_STATES, isValidState } from "@/modules/india-location";

interface IndiaStateComboboxProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

function normalizeStateSearch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findExactState(value: string): string | null {
  const normalized = normalizeStateSearch(value);
  if (!normalized) return null;
  return (
    INDIA_STATES.find((state) => normalizeStateSearch(state) === normalized) ??
    null
  );
}

/*
 * IndiaStateCombobox
 * Searchable, scrollable picker for Indian states and union territories.
 * Exact typed matches such as "haryana" are canonicalized to "Haryana".
 */
export function IndiaStateCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select state or UT",
  "aria-label": ariaLabel = "State or Union Territory",
}: IndiaStateComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ?? "");

  const filteredStates = useMemo(() => {
    const normalizedQuery = normalizeStateSearch(query);
    if (!normalizedQuery) return INDIA_STATES;
    return INDIA_STATES.filter((state) =>
      normalizeStateSearch(state).includes(normalizedQuery),
    );
  }, [query]);

  const selectState = (state: string) => {
    if (!isValidState(state)) return;
    onValueChange(state);
    setQuery(state);
    setOpen(false);
  };

  const selectExactOrFirst = () => {
    const exactState = findExactState(query);
    if (exactState) {
      selectState(exactState);
      return true;
    }
    const firstState = filteredStates[0];
    if (firstState) {
      selectState(firstState);
      return true;
    }
    return false;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setQuery(value ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="default"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className="w-full justify-between rounded-lg font-normal"
        >
          <span className={cn("truncate", !value && "text-brand-foreground-secondary")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] rounded-xl border border-brand-border bg-white p-2 shadow-none"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-foreground-secondary" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                selectExactOrFirst();
              }
            }}
            onBlur={() => {
              const exactState = findExactState(query);
              if (exactState) selectState(exactState);
            }}
            placeholder="Search state or UT"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="mt-2 max-h-60 overflow-y-auto pr-1">
          {filteredStates.length === 0 ? (
            <p className="px-3 py-2 text-sm text-brand-foreground-muted">
              No state or union territory found.
            </p>
          ) : (
            filteredStates.map((state) => (
              <button
                key={state}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-brand-foreground transition-colors hover:bg-brand-surface",
                  state === value && "bg-brand-surface text-brand-primary",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectState(state)}
              >
                <span className="truncate">{state}</span>
                {state === value ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
