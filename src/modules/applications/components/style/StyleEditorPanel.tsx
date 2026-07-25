"use client";

import { TemplateSection } from "./TemplateSection";
import { AccentColorSection } from "./AccentColorSection";
import { FontSection } from "./FontSection";
import { SpacingSection } from "./SpacingSection";
import { ContentStyleSection } from "./ContentStyleSection";
import { LayoutSection } from "./LayoutSection";
import { AutoFitSection } from "./AutoFitSection";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

interface StyleEditorPanelProps {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
  resumeDoc?: ResumeDocument;
  onOverflowChange: (overflow: boolean) => void;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-brand-border bg-white p-5 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function StyleEditorPanel({
  config,
  onChange,
  resumeDoc,
  onOverflowChange,
}: StyleEditorPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <TemplateSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <AccentColorSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <FontSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <SpacingSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <ContentStyleSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <LayoutSection config={config} onChange={onChange} />
      </Card>

      <Card>
        <AutoFitSection
          config={config}
          onChange={onChange}
          doc={resumeDoc}
          onOverflowChange={onOverflowChange}
        />
      </Card>
    </div>
  );
}
