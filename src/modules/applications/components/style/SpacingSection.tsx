"use client";

import { Ruler } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { BOUNDS } from "@/lib/validations/resume-style.schema";

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function SpacingSection({ config, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Spacing</h3>
      </div>

      <div className="space-y-4">
        <SliderField
          label="Section gap"
          value={config.spacing.sectionSpacing}
          min={BOUNDS.spacing.sectionSpacing.min}
          max={BOUNDS.spacing.sectionSpacing.max}
          step={1}
          unit="pt"
          onChange={(v) =>
            onChange({
              ...config,
              spacing: { ...config.spacing, sectionSpacing: v },
            })
          }
        />
        <SliderField
          label="Entry gap"
          value={config.spacing.entrySpacing}
          min={BOUNDS.spacing.entrySpacing.min}
          max={BOUNDS.spacing.entrySpacing.max}
          step={1}
          unit="pt"
          onChange={(v) =>
            onChange({
              ...config,
              spacing: { ...config.spacing, entrySpacing: v },
            })
          }
        />
        <SliderField
          label="Line height"
          value={config.spacing.lineSpacing}
          min={BOUNDS.spacing.lineSpacing.min}
          max={BOUNDS.spacing.lineSpacing.max}
          step={0.05}
          unit="×"
          onChange={(v) =>
            onChange({
              ...config,
              spacing: { ...config.spacing, lineSpacing: v },
            })
          }
        />
        <SliderField
          label="Margin"
          value={config.spacing.margin}
          min={BOUNDS.spacing.margin.min}
          max={BOUNDS.spacing.margin.max}
          step={1}
          unit="pt"
          onChange={(v) =>
            onChange({
              ...config,
              spacing: { ...config.spacing, margin: v },
            })
          }
        />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-foreground-muted">{label}</span>
        <span className="text-xs font-medium text-brand-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}
