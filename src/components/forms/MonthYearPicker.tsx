"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  startYear?: number;
  endYear?: number;
  required?: boolean;
  "aria-label"?: string;
}

const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
] as const;

function parseMonthYear(value: string | null | undefined): {
  month: string;
  year: string;
} {
  if (!value) return { month: "", year: "" };
  const [month, year] = value.split("/");
  if (!month || !year || !/^(0[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year)) {
    return { month: "", year: "" };
  }
  return { month, year };
}

function buildMonthYear(month: string, year: string): string | null {
  if (!month || !year) return null;
  return `${month}/${year}`;
}

function getYearOptions(startYear: number, endYear: number): string[] {
  const years: string[] = [];
  for (let year = endYear; year >= startYear; year -= 1) {
    years.push(String(year));
  }
  return years;
}

/*
 * MonthYearPicker
 * Controlled month/year selector that stores dates as MM/YYYY strings.
 * Avoids browser-native month input inconsistencies in onboarding.
 */
export function MonthYearPicker({
  value,
  onChange,
  disabled = false,
  startYear = 1970,
  endYear = new Date().getFullYear() + 8,
  required = false,
  "aria-label": ariaLabel = "Month and year",
}: MonthYearPickerProps) {
  const parsedValue = useMemo(() => parseMonthYear(value), [value]);
  const [draft, setDraft] = useState(parsedValue);
  const years = getYearOptions(startYear, endYear);

  useEffect(() => {
    setDraft(parsedValue);
  }, [parsedValue]);

  const updateDraft = (nextDraft: { month: string; year: string }) => {
    setDraft(nextDraft);
    const nextValue = buildMonthYear(nextDraft.month, nextDraft.year);
    if (nextValue) {
      onChange(nextValue);
    }
  };

  const handleMonthChange = (month: string) => {
    updateDraft({ ...draft, month });
  };

  const handleYearChange = (year: string) => {
    updateDraft({ ...draft, year });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2",
        disabled && "opacity-50",
      )}
      aria-label={ariaLabel}
    >
      <Select
        value={draft.month}
        onValueChange={handleMonthChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="rounded-lg bg-white">
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-foreground-secondary" />
            <SelectValue placeholder="Month" />
          </span>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={draft.year}
        onValueChange={handleYearChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="rounded-lg bg-white">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent position="item-aligned" className="max-h-60">
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
