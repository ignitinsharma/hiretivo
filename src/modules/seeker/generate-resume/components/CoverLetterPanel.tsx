"use client";

import type { CoverLetterOutput } from "@/lib/ai-prompts";

interface CoverLetterPanelProps {
  coverLetter: CoverLetterOutput;
}

/*
 * CoverLetterPanel
 * Renders the structured cover letter: greeting, body paragraphs, closing, and
 * signoff. Uses the existing card pattern with the brand design system.
 * @param coverLetter - structured cover letter from the cover-letter API
 */
export function CoverLetterPanel({ coverLetter }: CoverLetterPanelProps) {
  const { greeting, body_paragraphs, closing, signoff } = coverLetter;

  if (!body_paragraphs.length) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <h2 className="font-semibold text-sm text-brand-foreground mb-2">Cover letter</h2>
        <p className="text-sm text-brand-foreground-muted">{greeting || "No cover letter generated yet."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6">
      <h2 className="font-semibold text-sm text-brand-foreground mb-3">Cover letter</h2>
      <div className="text-sm text-brand-foreground leading-relaxed space-y-3">
        {greeting && <p className="font-medium">{greeting}</p>}
        {body_paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        {closing && <p>{closing}</p>}
        {signoff && <p className="text-brand-foreground-muted whitespace-pre-line">{signoff}</p>}
      </div>
    </div>
  );
}