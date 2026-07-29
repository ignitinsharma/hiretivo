"use client";

import { Palette } from "lucide-react";
import { TEMPLATE_DEFAULTS } from "@/lib/validations/resume-style.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

const TEMPLATES = [
  { key: "compact" as const, label: "Compact", desc: "Dense, single-column" },
  { key: "centered" as const, label: "Centered", desc: "Centered titles, clean" },
  { key: "structured" as const, label: "Structured", desc: "Two-column layout" },
];

const PAPER_SIZES = [
  { value: "letter" as const, label: "US Letter" },
  { value: "a4" as const, label: "A4" },
  { value: "legal" as const, label: "Legal" },
];

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function TemplateSection({ config, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Template</h3>
      </div>

      {/* Inline template thumbnails */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange({ ...TEMPLATE_DEFAULTS[t.key] })}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-left ${
              config.template === t.key
                ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                : "border-brand-border hover:border-brand-border/80 hover:bg-brand-border/10"
            }`}
          >
            {/* Mini preview box */}
            <div
              className={`w-full h-14 rounded border border-brand-border/50 bg-white flex flex-col gap-0.5 p-1.5 ${
                t.key === "centered"
                  ? "items-center"
                  : t.key === "structured"
                    ? ""
                    : ""
              }`}
            >
              {/* Simulated name line */}
              <div
                className={`h-1.5 bg-brand-foreground/30 rounded w-2/3 ${
                  t.key === "centered" ? "" : t.key === "structured" ? "ml-auto" : ""
                }`}
              />
              {/* Simulated section divider */}
              <div
                className={`h-px bg-brand-border/60 ${
                  t.key === "centered" ? "w-1/3" : "w-full"
                }`}
              />
              {/* Simulated text lines */}
              <div className="flex flex-col gap-0.5 w-full">
                <div className="h-1 bg-brand-foreground/15 rounded w-full" />
                <div className="h-1 bg-brand-foreground/15 rounded w-4/5" />
                {t.key === "structured" && (
                  <div className="flex gap-1">
                    <div className="h-1 bg-brand-foreground/15 rounded w-1/4" />
                    <div className="h-1 bg-brand-foreground/15 rounded flex-1" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] font-bold text-brand-foreground">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Paper size */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-foreground-muted">Paper size</span>
        <select
          value={config.paperSize}
          onChange={(e) =>
            onChange({ ...config, paperSize: e.target.value as ResumeStyleConfig["paperSize"] })
          }
          className="text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground"
        >
          {PAPER_SIZES.map((ps) => (
            <option key={ps.value} value={ps.value}>
              {ps.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
