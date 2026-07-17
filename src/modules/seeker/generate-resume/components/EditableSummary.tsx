"use client";

import { Textarea } from "@/components/ui/textarea";

interface EditableSummaryProps {
  value: string;
  onChange: (value: string) => void;
}

export function EditableSummary({ value, onChange }: EditableSummaryProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
        Summary
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Professional summary..."
        className="min-h-[100px] resize-y text-sm"
      />
    </div>
  );
}
