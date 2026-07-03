"use client";

import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { ApplicationDetail } from "@/modules/seeker/apply/types/apply.types";

interface StepDoneProps {
  application: ApplicationDetail;
  tailoredResumeUrl: string | null;
  coverLetter: string;
}

/*
 * StepDone
 * Confirmation view after finalize (or on re-opening a completed
 * application): tabs over what was submitted — the ATS-form snapshot, the
 * tailored resume PDF link, and the cover letter — plus a link to the
 * tracker (Phase 6).
 */
export function StepDone({ application, tailoredResumeUrl, coverLetter }: StepDoneProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-brand-success">
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-sm font-medium">Application recorded</p>
      </div>

      <Tabs defaultValue="form">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="form">Submitted form</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="cover">Cover letter</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form" className="flex flex-col gap-2 pt-4">
          {(application.submittedFormData ?? []).map((row) => (
            <div key={row.fieldKey} className="flex justify-between gap-3 text-sm">
              <span className="text-brand-foreground-muted">{row.label}</span>
              <span className="text-brand-foreground">{row.value || "Not set"}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="resume" className="pt-4">
          {tailoredResumeUrl ? (
            <a
              href={tailoredResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              View tailored resume PDF
            </a>
          ) : (
            <p className="text-sm text-brand-foreground-muted">Resume link unavailable.</p>
          )}
        </TabsContent>

        <TabsContent value="cover" className="pt-4">
          <p className="whitespace-pre-wrap text-sm text-brand-foreground">{coverLetter}</p>
        </TabsContent>
      </Tabs>

      <Button variant="secondary" size="sm" className="self-start" asChild>
        <Link href="/dashboard/tracker">Go to tracker</Link>
      </Button>
    </div>
  );
}
