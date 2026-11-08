"use client";

import { BUILT_IN_THEMES } from "@/lib/resume/style/built-in-themes";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

interface BaseResumePresentationProps {
  config: ResumeStyleConfig;
  onChange: (config: ResumeStyleConfig) => void;
}

/* Selects a built-in theme and adjusts the base resume's presentation. */
export function BaseResumePresentation({ config, onChange }: BaseResumePresentationProps) {
  return (
    <section className="space-y-4" aria-labelledby="resume-presentation-title">
      <div>
        <h2 id="resume-presentation-title" className="text-lg font-semibold text-brand-foreground">Presentation</h2>
        <p className="text-sm text-brand-foreground-muted">Choose a theme, then fine tune the page. Save changes to keep your selection.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" role="group" aria-label="Resume themes">
        {BUILT_IN_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={config.themeId === theme.id}
            onClick={() => onChange({ ...theme.config })}
            className={`rounded-lg border p-3 text-left transition-colors ${config.themeId === theme.id ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-white hover:border-brand-primary"}`}
          >
            <span className="mb-2 block h-1 w-8 rounded" style={{ backgroundColor: theme.config.accentColor }} aria-hidden="true" />
            <span className="block text-sm font-semibold text-brand-foreground">{theme.name}</span>
            <span className="block text-xs text-brand-foreground-muted">{theme.description}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs font-medium text-brand-foreground-muted">
          <span>Paper size</span>
          <select className="w-full rounded-lg border border-brand-border bg-white p-2 text-sm text-brand-foreground" value={config.paperSize} onChange={(event) => onChange({ ...config, paperSize: event.target.value as ResumeStyleConfig["paperSize"] })}>
            <option value="letter">US Letter</option><option value="a4">A4</option><option value="legal">Legal</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-brand-foreground-muted">
          <span>Body text size</span>
          <input className="w-full" type="range" min="8.5" max="14" step="0.5" value={config.fontSize.bodyText} onChange={(event) => onChange({ ...config, fontSize: { ...config.fontSize, bodyText: Number(event.target.value) } })} />
          <span className="block">{config.fontSize.bodyText} pt</span>
        </label>
        <label className="space-y-1 text-xs font-medium text-brand-foreground-muted">
          <span>Accent color</span>
          <input className="block h-10 w-full rounded-lg border border-brand-border bg-white p-1" type="color" value={config.accentColor} onChange={(event) => onChange({ ...config, accentColor: event.target.value })} />
        </label>
      </div>
    </section>
  );
}
