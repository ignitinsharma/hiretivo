"use client";

import { Settings2 } from "lucide-react";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

const DATE_FORMATS = [
  { value: "short_month" as const, label: "Jan 2024" },
  { value: "numeric" as const, label: "01/2024" },
  { value: "full_month" as const, label: "January 2024" },
  { value: "year_only" as const, label: "2024" },
];

const BULLET_TYPES = [
  { value: "dot" as const, label: "•" },
  { value: "dash" as const, label: "–" },
];

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function ContentStyleSection({ config, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Content Style</h3>
      </div>

      <div className="space-y-3">
        {/* Date format */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-foreground-muted">Date format</span>
          <select
            value={config.dateFormat}
            onChange={(e) =>
              onChange({
                ...config,
                dateFormat: e.target.value as ResumeStyleConfig["dateFormat"],
              })
            }
            className="text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground"
          >
            {DATE_FORMATS.map((df) => (
              <option key={df.value} value={df.value}>
                {df.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bullet icon */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-foreground-muted">Bullet icon</span>
          <div className="flex items-center gap-1">
            {BULLET_TYPES.map((b) => (
              <button
                key={b.value}
                onClick={() =>
                  onChange({
                    ...config,
                    bulletIcon: b.value as ResumeStyleConfig["bulletIcon"],
                  })
                }
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                  config.bulletIcon === b.value
                    ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/30"
                    : "bg-white border border-brand-border text-brand-foreground/70"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hide dividers */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-brand-foreground-muted">Hide dividers</span>
          <input
            type="checkbox"
            checked={config.hideDivider}
            onChange={(e) => onChange({ ...config, hideDivider: e.target.checked })}
            className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
          />
        </label>
      </div>
    </div>
  );
}
