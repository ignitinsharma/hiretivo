"use client";

import { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface JdInput {
  jdText: string;
  jobTitle: string;
  company: string;
}

interface JdInputPanelProps {
  value: JdInput;
  onChange: (input: JdInput) => void;
}

/*
 * JdInputPanel
 * JD input fall: textarea for pasting job description text. Title and company
 * fields extracted from the JD help the AI generate better output.
 * Auto-resizes the textarea as the user types.
 * @param value - current JD input state
 * @param onChange - called with the next JdInput on any field edit
 */
export function JdInputPanel({ value, onChange }: JdInputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
    }
  }, [value.jdText]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="gen-resume-jd" className="mb-1.5 block">
          Paste job description
        </Label>
        <Textarea
          ref={textareaRef}
          id="gen-resume-jd"
          placeholder="Paste the full job description here — responsibilities, requirements, qualifications..."
          value={value.jdText}
          onChange={(e) => onChange({ ...value, jdText: e.target.value })}
          rows={8}
          className="min-h-[140px] resize-none"
        />
        <p className="mt-1 text-xs text-brand-foreground-secondary">
          {value.jdText.length} characters
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="gen-resume-title" className="mb-1 block">
            Job title
          </Label>
          <input
            id="gen-resume-title"
            type="text"
            placeholder="e.g. Senior Product Manager"
            value={value.jobTitle}
            onChange={(e) => onChange({ ...value, jobTitle: e.target.value })}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="gen-resume-company" className="mb-1 block">
            Company
          </Label>
          <input
            id="gen-resume-company"
            type="text"
            placeholder="e.g. Stripe"
            value={value.company}
            onChange={(e) => onChange({ ...value, company: e.target.value })}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}