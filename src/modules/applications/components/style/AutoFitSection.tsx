"use client";

import { useState } from "react";
import { Maximize2, Undo2 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { fitToOnePage } from "@/lib/resume/style/fit-to-one-page";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

interface Props {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
  doc: ResumeDocument | undefined;
  onOverflowChange: (overflow: boolean) => void;
}

export function AutoFitSection({ config, onChange, doc, onOverflowChange }: Props) {
  const [fitting, setFitting] = useState(false);

  const canFit = config.autoFitEnabled && !!doc;
  const canUndo = config.lastFitSnapshot !== null;

  const handleFitNow = async () => {
    if (!doc) return;
    setFitting(true);
    try {
      const { config: fitted, overflow } = await fitToOnePage(doc, config);
      onOverflowChange(overflow);
      onChange({
        ...fitted,
        autoFitEnabled: config.autoFitEnabled,
        lastFitSnapshot: {
          spacing: { ...config.spacing },
          fontSize: { ...config.fontSize },
        },
      });
    } catch {
    } finally {
      setFitting(false);
    }
  };

  const handleUndo = () => {
    const snap = config.lastFitSnapshot;
    if (!snap) return;
    onChange({
      ...config,
      spacing: { ...snap.spacing },
      fontSize: { ...snap.fontSize },
      lastFitSnapshot: null,
      autoFitEnabled: config.autoFitEnabled,
    });
    onOverflowChange(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Maximize2 className="h-4 w-4 text-brand-primary" />
        <h3 className="text-sm font-bold text-brand-foreground">Fit</h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-brand-foreground-muted">Single page</span>
        <Toggle
          pressed={config.autoFitEnabled}
          onPressedChange={(pressed) =>
            onChange({ ...config, autoFitEnabled: pressed })
          }
          variant="outline"
          size="sm"
        >
          {config.autoFitEnabled ? "On" : "Off"}
        </Toggle>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleFitNow}
          disabled={!canFit || fitting}
          className="text-xs"
        >
          {fitting ? "Fitting…" : "Fit now"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          className="text-xs"
        >
          <Undo2 className="mr-1 h-3 w-3" />
          Undo fit
        </Button>
      </div>
    </div>
  );
}
