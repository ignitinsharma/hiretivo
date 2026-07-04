"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheatsheetSection } from "@/constants/enums";
import type { SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";

interface CheatsheetPanelProps {
  rows: SubmittedFormField[];
  resumeText?: string;
  coverLetterText?: string;
}

const SECTION_LABELS: Record<CheatsheetSection, string> = {
  [CheatsheetSection.PERSONAL_INFO]: "Personal Info",
  [CheatsheetSection.CONTACT]: "Contact",
  [CheatsheetSection.WORK_AUTH]: "Work Authorization",
  [CheatsheetSection.RESUME]: "Resume",
  [CheatsheetSection.COVER_LETTER]: "Cover Letter",
};

// Which ApplicationDefaults/settings fields group under which cheatsheet
// section — resume/cover-letter sections are handled separately since they
// carry a single block of text rather than a list of rows.
const FIELD_SECTION_MAP: Record<string, CheatsheetSection> = {
  fullName: CheatsheetSection.PERSONAL_INFO,
  email: CheatsheetSection.CONTACT,
  phone: CheatsheetSection.CONTACT,
  addressLine: CheatsheetSection.CONTACT,
  city: CheatsheetSection.CONTACT,
  state: CheatsheetSection.CONTACT,
  postalCode: CheatsheetSection.CONTACT,
  linkedinUrl: CheatsheetSection.CONTACT,
  workAuth: CheatsheetSection.WORK_AUTH,
  needsSponsorship: CheatsheetSection.WORK_AUTH,
};

const FIELD_ROW_SECTIONS = [CheatsheetSection.PERSONAL_INFO, CheatsheetSection.CONTACT, CheatsheetSection.WORK_AUTH];

/*
 * copyText
 * Writes to the clipboard via the async Clipboard API, falling back to a
 * hidden-textarea + execCommand for browsers/contexts where it's unavailable
 * (older Safari, non-HTTPS, some in-app webviews).
 * @param text - text to copy
 * @returns true if the copy succeeded
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

/*
 * CheatsheetPanel
 * Copy-paste ATS-form cheatsheet built from ApplicationDefaults + profile,
 * plus the tailored resume and cover letter text — everything the assisted
 * (non-automated) submit flow needs the seeker to paste by hand. Grouped
 * into collapsible sections with a top-level "copy all" for ATS forms that
 * accept one multi-field paste, and per-section copy buttons.
 * @param rows - one row per ATS profile field, value "" when unset
 * @param resumeText - plain-text formatted resume (formatResumeAsText), omitted until generated
 * @param coverLetterText - generated cover letter text, omitted until generated
 */
export function CheatsheetPanel({ rows, resumeText, coverLetterText }: CheatsheetPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const missing = rows.filter((r) => !r.value);

  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    const ok = await copyText(value);
    if (ok) {
      setCopiedKey(key);
      toast.success("Copied!");
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } else {
      toast.error("Couldn't copy — select and copy manually.");
    }
  };

  const handleCopyAllFields = () => {
    const text = rows.map((r) => `${r.label}:\t${r.value || "Not set"}`).join("\n");
    void handleCopy("all-fields", text);
  };

  const rowsBySection = (section: CheatsheetSection) =>
    rows.filter((r) => FIELD_SECTION_MAP[r.fieldKey] === section);

  const openSections = [
    ...FIELD_ROW_SECTIONS,
    ...(resumeText ? [CheatsheetSection.RESUME] : []),
    ...(coverLetterText ? [CheatsheetSection.COVER_LETTER] : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      {missing.length > 0 && (
        <p className="text-sm text-brand-foreground-muted">
          Some fields are missing.{" "}
          <Link href="/profile" className="font-medium text-brand-primary hover:underline">
            Complete your profile
          </Link>{" "}
          before submitting.
        </p>
      )}

      <Button variant="secondary" size="sm" className="self-start" onClick={handleCopyAllFields}>
        {copiedKey === "all-fields" ? (
          <>
            <Check className="h-4 w-4" /> Copied all fields
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copy all profile fields
          </>
        )}
      </Button>

      <Accordion type="multiple" defaultValue={openSections} className="rounded-lg border border-brand-border">
        {FIELD_ROW_SECTIONS.map((section) => {
          const sectionRows = rowsBySection(section);
          if (!sectionRows.length) return null;
          return (
            <AccordionItem key={section} value={section} className="border-b border-brand-border px-4 last:border-b-0">
              <AccordionTrigger>{SECTION_LABELS[section]}</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col divide-y divide-brand-border">
                  {sectionRows.map((row) => (
                    <div key={row.fieldKey} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-secondary">
                          {row.label}
                        </p>
                        <p className="truncate text-sm text-brand-foreground">{row.value || "Not set"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copy ${row.label}`}
                        disabled={!row.value}
                        onClick={() => handleCopy(row.fieldKey, row.value)}
                      >
                        {copiedKey === row.fieldKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        {resumeText && (
          <AccordionItem value={CheatsheetSection.RESUME} className="border-b border-brand-border px-4 last:border-b-0">
            <AccordionTrigger>{SECTION_LABELS[CheatsheetSection.RESUME]}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => handleCopy(CheatsheetSection.RESUME, resumeText)}
                >
                  {copiedKey === CheatsheetSection.RESUME ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy resume as text
                    </>
                  )}
                </Button>
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-brand-surface p-3 text-xs text-brand-foreground-muted">
                  {resumeText}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {coverLetterText && (
          <AccordionItem
            value={CheatsheetSection.COVER_LETTER}
            className="border-b border-brand-border px-4 last:border-b-0"
          >
            <AccordionTrigger>{SECTION_LABELS[CheatsheetSection.COVER_LETTER]}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => handleCopy(CheatsheetSection.COVER_LETTER, coverLetterText)}
                >
                  {copiedKey === CheatsheetSection.COVER_LETTER ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy cover letter
                    </>
                  )}
                </Button>
                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-brand-surface p-3 text-xs text-brand-foreground-muted">
                  {coverLetterText}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
