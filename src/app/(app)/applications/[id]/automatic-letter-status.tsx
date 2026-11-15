"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { toastResult } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/use-job";
import { retry } from "@/lib/jobs/actions";
import type { JobView } from "@/lib/jobs/runner";

/** A saved resume whose cover letter is still being written or can be retried. */
export function AutomaticLetterStatus({ job: initial }: { job: Pick<JobView, "id" | "status" | "error"> }) {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const refreshed = useRef(false);
  const live = useJob(initial.id, revision, (view) => {
    if (view.status === "DONE" && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  });
  const job = live ?? initial;
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-line-card bg-card px-6 py-5">
      <h2 className="text-subsection">Your resume is saved</h2>
      {job.status === "FAILED" ? (
        <>
          <p role="alert" className="text-sm text-error">The cover letter could not be finished. {job.error}</p>
          <Button onClick={() => void (async () => {
            if (toastResult(await retry({ id: initial.id })).ok) {
              refreshed.current = false;
              setRevision((count) => count + 1);
            }
          })()}>Retry cover letter</Button>
        </>
      ) : (
        <p role="status" className="text-sm text-muted">Writing your cover letter. You can use your resume while it finishes.</p>
      )}
    </div>
  );
}
