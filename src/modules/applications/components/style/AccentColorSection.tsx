"use client";

import { PaintBucket } from "lucide-react";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

const SCOPE_OPTIONS = [
  { value: "all_headings" as const, label: "All headings" },
  { value: "name_only" as const, label: "Name only" },
  { value: "section_headers_only" as const, label: "Section headers" },
  { value: "links_icons_only" as const, label: "Links & icons" },
];

// Simple relative luminance check — clamps near-white colors
function isTooLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.85;
}

function normalizeHex(val: string): string {
  let s = val.replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return "#" + s.slice(0, 6).toLowerCase();
}

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function AccentColorSection({ config, onChange }: Props) {
  const clamped = isTooLight(config.accentColor);
  const displayColor = clamped ? "#595959" : config.accentColor;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <PaintBucket className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Accent Color</h3>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={displayColor}
            onChange={(e) => onChange({ ...config, accentColor: e.target.value })}
            className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
          />
          <div
            className="w-8 h-8 rounded-md border border-brand-border"
            style={{ backgroundColor: displayColor }}
          />
        </div>
        <input
          type="text"
          value={config.accentColor}
          onBlur={(e) => {
            const normalized = normalizeHex(e.target.value);
            if (normalized !== config.accentColor) {
              onChange({ ...config, accentColor: normalized });
            }
          }}
          onChange={(e) => onChange({ ...config, accentColor: e.target.value })}
          className="w-24 text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground font-mono"
          placeholder="#000000"
        />
        <select
          value={config.accentColorScope}
          onChange={(e) =>
            onChange({
              ...config,
              accentColorScope: e.target.value as ResumeStyleConfig["accentColorScope"],
            })
          }
          className="flex-1 text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground"
        >
          {SCOPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {clamped && (
        <p className="text-[10px] text-amber-600 mt-2">
          Too light for print — using {displayColor} instead
        </p>
      )}
    </div>
  );
}
