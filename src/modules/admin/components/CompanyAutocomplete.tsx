"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useCompanySuggest } from "../hooks/use-company-suggest";
import { LogoPreview } from "./LogoPreview";
import type { CompanySuggestion } from "../types/admin-job.types";

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (company: CompanySuggestion) => void;
  placeholder?: string;
}

/*
 * CompanyAutocomplete
 * Combobox over previously-used admin companies. Auto-fills full company details
 * when a suggestion is picked. Falls through to free-text entry when no match.
 */
export function CompanyAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
}: CompanyAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useCompanySuggest(value);
  const suggestions = data?.companies ?? [];

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder ?? "Company name"}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && value.trim().length >= 1 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-brand-border bg-white max-h-72 overflow-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-brand-foreground-muted">Searching…</div>
          )}
          {!isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-brand-foreground-muted">
              No previous companies — entered as new
            </div>
          )}
          {suggestions.map((s) => (
            <button
              type="button"
              key={`${s.companyName}-${s.companyLogoUrl ?? "none"}`}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-surface"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setOpen(false);
              }}
            >
              <LogoPreview url={s.companyLogoUrl ?? ""} companyName={s.companyName} size={28} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-brand-foreground">{s.companyName}</span>
                {s.companyIndustry && (
                  <span className="text-xs text-brand-foreground-muted">{s.companyIndustry}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
