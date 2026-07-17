"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CoverLetterOutput } from "@/lib/ai-prompts";

interface EditableCoverLetterProps {
  coverLetter: CoverLetterOutput;
  onChange: (coverLetter: CoverLetterOutput) => void;
}

export function EditableCoverLetter({ coverLetter, onChange }: EditableCoverLetterProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const updateGreeting = (value: string) => {
    onChange({ ...coverLetter, greeting: value });
  };

  const updateParagraph = (index: number, value: string) => {
    const next = coverLetter.body_paragraphs.map((p, i) => (i === index ? value : p));
    onChange({ ...coverLetter, body_paragraphs: next });
  };

  const updateClosing = (value: string) => {
    onChange({ ...coverLetter, closing: value });
  };

  const updateSignoff = (value: string) => {
    onChange({ ...coverLetter, signoff: value });
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const text = [
        coverLetter.greeting,
        "",
        ...coverLetter.body_paragraphs,
        "",
        coverLetter.closing,
        "",
        coverLetter.signoff,
      ].join("\n\n");

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cover_Letter.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-brand-foreground">Cover letter</h2>
        <Button variant="secondary" size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="animate-spin mr-1.5 h-4 w-4" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Download
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-brand-foreground-muted">Greeting</label>
          <Textarea
            value={coverLetter.greeting}
            onChange={(e) => updateGreeting(e.target.value)}
            className="min-h-[40px] resize-y text-sm"
          />
        </div>

        {coverLetter.body_paragraphs.map((para, i) => (
          <div key={i} className="space-y-1">
            <label className="text-xs text-brand-foreground-muted">Paragraph {i + 1}</label>
            <Textarea
              value={para}
              onChange={(e) => updateParagraph(i, e.target.value)}
              className="min-h-[80px] resize-y text-sm"
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-xs text-brand-foreground-muted">Closing</label>
          <Textarea
            value={coverLetter.closing}
            onChange={(e) => updateClosing(e.target.value)}
            className="min-h-[40px] resize-y text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-brand-foreground-muted">Sign-off</label>
          <Textarea
            value={coverLetter.signoff}
            onChange={(e) => updateSignoff(e.target.value)}
            className="min-h-[60px] resize-y text-sm"
          />
        </div>
      </div>
    </div>
  );
}
