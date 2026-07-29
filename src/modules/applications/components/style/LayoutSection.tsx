"use client";

import { LayoutGrid } from "lucide-react";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const HEADER_ALIGNMENTS = [
  { value: "left" as const, label: "Left" },
  { value: "center" as const, label: "Center" },
  { value: "right" as const, label: "Right" },
];

const SKILLS_LAYOUTS = [
  { value: "paragraph" as const, label: "Paragraph" },
  { value: "bulleted_list" as const, label: "Bulleted" },
  { value: "dense_wrap" as const, label: "Dense" },
];

const EDU_ORDERS = [
  { value: "institution_first" as const, label: "School first" },
  { value: "degree_first" as const, label: "Degree first" },
];

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

export function LayoutSection({ config, onChange }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <LayoutGrid className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Layout</h3>
      </div>

      <div className="space-y-4">
        {/* Header alignment */}
        <div>
          <span className="text-xs text-brand-foreground-muted block mb-1.5">
            Header alignment
          </span>
          <ToggleGroup
            type="single"
            value={config.headerAlignment}
            onValueChange={(v) => {
              if (v) onChange({ ...config, headerAlignment: v as ResumeStyleConfig["headerAlignment"] });
            }}
            className="w-full justify-start"
          >
            {HEADER_ALIGNMENTS.map((a) => (
              <ToggleGroupItem key={a.value} value={a.value} className="flex-1 text-xs">
                {a.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Education order */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-foreground-muted">Education</span>
          <select
            value={config.educationFieldOrder}
            onChange={(e) =>
              onChange({
                ...config,
                educationFieldOrder: e.target.value as ResumeStyleConfig["educationFieldOrder"],
              })
            }
            className="text-xs border border-brand-border rounded-lg h-8 px-2 bg-white text-brand-foreground"
          >
            {EDU_ORDERS.map((eo) => (
              <option key={eo.value} value={eo.value}>
                {eo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Skills layout */}
        <div>
          <span className="text-xs text-brand-foreground-muted block mb-1.5">
            Skills layout
          </span>
          <ToggleGroup
            type="single"
            value={config.skillsLayout}
            onValueChange={(v) => {
              if (v) onChange({ ...config, skillsLayout: v as ResumeStyleConfig["skillsLayout"] });
            }}
            className="w-full justify-start"
          >
            {SKILLS_LAYOUTS.map((sl) => (
              <ToggleGroupItem key={sl.value} value={sl.value} className="flex-1 text-xs">
                {sl.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
