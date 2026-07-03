"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubmittedFormField } from "@/modules/seeker/apply/types/apply.types";

interface CheatsheetPanelProps {
  rows: SubmittedFormField[];
}

/*
 * CheatsheetPanel
 * Copy-paste ATS-form cheatsheet built from ApplicationDefaults + profile —
 * the data the assisted (non-automated) submit flow can't fill in for the
 * user. Rows with an empty value prompt a link to /profile to fill them in
 * before the seeker finishes submitting on the source ATS.
 * @param rows - one row per ATS field, value "" when unset
 */
export function CheatsheetPanel({ rows }: CheatsheetPanelProps) {
  const missing = rows.filter((r) => !r.value);

  const handleCopy = (value: string) => {
    void navigator.clipboard.writeText(value);
  };

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
      <div className="divide-y divide-brand-border rounded-lg border border-brand-border">
        {rows.map((row) => (
          <div key={row.fieldKey} className="flex items-center justify-between gap-3 px-4 py-3">
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
              onClick={() => handleCopy(row.value)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
