"use client";

import { Type } from "lucide-react";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { BOUNDS } from "@/lib/validations/resume-style.schema";

const FONT_FAMILIES = [
  { value: "times_new_roman" as const, label: "Times New Roman" },
  { value: "arial" as const, label: "Arial" },
  { value: "helvetica" as const, label: "Helvetica" },
  { value: "calibri" as const, label: "Calibri" },
  { value: "georgia" as const, label: "Georgia" },
  { value: "garamond" as const, label: "Garamond" },
  { value: "cambria" as const, label: "Cambria" },
];

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function FontSection({ config, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Type className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Font</h3>
      </div>

      {/* Font family */}
      <select
        value={config.fontFamily}
        onChange={(e) =>
          onChange({
            ...config,
            fontFamily: e.target.value as ResumeStyleConfig["fontFamily"],
          })
        }
        className="w-full text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground mb-3"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font sizes — 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        <SizeField
          label="Name"
          value={config.fontSize.name}
          min={BOUNDS.fontSize.name.min}
          max={BOUNDS.fontSize.name.max}
          onChange={(v) =>
            onChange({ ...config, fontSize: { ...config.fontSize, name: v } })
          }
        />
        <SizeField
          label="Section"
          value={config.fontSize.sectionHeaders}
          min={BOUNDS.fontSize.sectionHeaders.min}
          max={BOUNDS.fontSize.sectionHeaders.max}
          onChange={(v) =>
            onChange({
              ...config,
              fontSize: { ...config.fontSize, sectionHeaders: v },
            })
          }
        />
        <SizeField
          label="Sub-header"
          value={config.fontSize.subHeaders}
          min={BOUNDS.fontSize.subHeaders.min}
          max={BOUNDS.fontSize.subHeaders.max}
          onChange={(v) =>
            onChange({
              ...config,
              fontSize: { ...config.fontSize, subHeaders: v },
            })
          }
        />
        <SizeField
          label="Body"
          value={config.fontSize.bodyText}
          min={BOUNDS.fontSize.bodyText.min}
          max={BOUNDS.fontSize.bodyText.max}
          onChange={(v) =>
            onChange({
              ...config,
              fontSize: { ...config.fontSize, bodyText: v },
            })
          }
        />
      </div>
    </div>
  );
}

function SizeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-brand-foreground-muted w-16 shrink-0">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={0.5}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="flex-1 text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground text-right"
      />
      <span className="text-[10px] text-brand-foreground-muted w-5">pt</span>
    </div>
  );
}
