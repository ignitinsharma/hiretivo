"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VerificationStatus } from "@/constants/enums";
import { ApproveForm } from "./ApproveForm";
import { RejectForm } from "./RejectForm";

interface AdminReviewPanelProps {
  engineerId: string;
  canReview: boolean;
  currentStatus: `${VerificationStatus}`;
}

/*
 * AdminReviewPanel
 * Lets admins choose and submit an approval or rejection decision.
 */
export function AdminReviewPanel({
  engineerId,
  canReview,
  currentStatus,
}: AdminReviewPanelProps) {
  const [activeForm, setActiveForm] = useState<"approve" | "reject" | null>(
    null,
  );
  const [isDone, setIsDone] = useState(false);

  if (!canReview) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <p className="mb-1 text-sm font-semibold text-brand-foreground">
          Review complete
        </p>
        <p className="text-sm text-brand-foreground-muted">
          Status: <span className="font-medium">{currentStatus}</span>
        </p>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6">
        <p className="text-sm font-semibold text-brand-success">
          Decision submitted
        </p>
        <p className="mt-1 text-sm text-brand-foreground-muted">
          The engineer outcome email will be sent by the review API.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/verification">Back to queue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-border bg-white p-6">
      <p className="mb-4 text-sm font-semibold text-brand-foreground">
        Review Decision
      </p>

      {!activeForm && (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => setActiveForm("approve")}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border-brand-danger text-brand-danger hover:bg-red-50"
            onClick={() => setActiveForm("reject")}
          >
            Reject
          </Button>
        </div>
      )}

      {activeForm === "approve" && (
        <ApproveForm
          engineerId={engineerId}
          onCancel={() => setActiveForm(null)}
          onDone={() => setIsDone(true)}
        />
      )}
      {activeForm === "reject" && (
        <RejectForm
          engineerId={engineerId}
          onCancel={() => setActiveForm(null)}
          onDone={() => setIsDone(true)}
        />
      )}
    </div>
  );
}
