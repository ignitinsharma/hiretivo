"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminCompanies, useReviewCompany } from "../hooks/use-admin-companies";
import type { AdminCompanyVerificationItem } from "../types/admin-company.types";

const CELL_BASE = "py-4 px-4 text-sm text-brand-foreground";
const CELL_MUTED = "py-4 px-4 text-sm text-brand-foreground-muted";

/*
 * VerificationBadge
 * Renders the appropriate status badge for a company verification record.
 * @param item - The company record to display status for
 */
function VerificationBadge({ item }: { item: AdminCompanyVerificationItem }) {
  if (item.companyVerified) {
    return (
      <Badge className="bg-green-100 text-green-700 border-0 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Verified
      </Badge>
    );
  }
  if (item.companyLinkedInUrl || item.companyWorkEmail) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-0 gap-1">
        <Clock className="w-3 h-3" />
        Pending review
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-500 border-0 gap-1">
      <XCircle className="w-3 h-3" />
      Not submitted
    </Badge>
  );
}

/*
 * CompanyRow
 * Single table row for a company verification entry.
 * Shows recruiter info, submission links, status badge, and approve/reject actions.
 * Actions are only shown for pending (not-yet-verified) submissions.
 * @param item - Company verification record
 * @param onApprove - Callback to approve the submission
 * @param onReject - Callback to reject the submission
 * @param isPending - Whether a mutation is in-flight for this row
 */
function CompanyRow({
  item,
  onApprove,
  onReject,
  isPending,
}: {
  item: AdminCompanyVerificationItem;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const hasPendingSubmission =
    !item.companyVerified && (item.companyLinkedInUrl || item.companyWorkEmail);

  return (
    <tr className="border-b border-brand-border hover:bg-brand-surface transition-colors">
      <td className={CELL_BASE}>
        <div className="font-medium">{item.companyName}</div>
        {item.website && (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-primary flex items-center gap-1 mt-0.5"
          >
            {item.website}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </td>

      <td className={CELL_MUTED}>
        <div>{item.user.name ?? "—"}</div>
        <div className="text-xs">{item.user.email ?? "—"}</div>
      </td>

      <td className={CELL_MUTED}>
        {item.companyLinkedInUrl ? (
          <a
            href={item.companyLinkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary flex items-center gap-1 text-xs"
          >
            LinkedIn
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          "—"
        )}
        {item.companyWorkEmail && (
          <div className="text-xs mt-0.5">{item.companyWorkEmail}</div>
        )}
      </td>

      <td className={CELL_MUTED}>
        <VerificationBadge item={item} />
        {item.companyVerifiedAt && (
          <div className="text-xs mt-1">
            {format(new Date(item.companyVerifiedAt), "MMM d, yyyy")}
          </div>
        )}
      </td>

      <td className={CELL_MUTED}>
        {format(new Date(item.updatedAt), "MMM d, yyyy")}
      </td>

      <td className="py-4 px-4">
        {hasPendingSubmission && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={onApprove}
              disabled={isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              disabled={isPending}
            >
              Reject
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

/*
 * AdminCompaniesList
 * Table view of company verification submissions for admin review.
 * Shows pending Level 2 submissions and already-verified companies.
 * Approve sets companyVerified=true; Reject clears the submission for re-submission.
 * Fetches data via useAdminCompanies; mutations via useReviewCompany.
 */
export function AdminCompaniesList() {
  const { data, isLoading, isError, refetch } = useAdminCompanies();
  const reviewMut = useReviewCompany();
  const [pendingId, setPendingId] = useState<string | null>(null);

  /*
   * handleReview
   * Fires the approve/reject mutation for a given profile ID.
   * Scopes loading state to the active row only.
   */
  const handleReview = async (profileId: string, action: "approve" | "reject") => {
    setPendingId(profileId);
    try {
      await reviewMut.mutateAsync({ profileId, action });
      toast.success(action === "approve" ? "Company verified" : "Submission rejected");
    } catch (e) {
      toast.error((e as Error).message ?? "Action failed");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-brand-foreground-muted text-sm">
        Loading company verifications...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-brand-foreground-muted">Failed to load companies.</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const companies = data ?? [];

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
        <p className="text-sm text-brand-foreground-muted">
          No company verification submissions yet.
        </p>
      </div>
    );
  }

  const pendingCount = companies.filter(
    (c) => !c.companyVerified && (c.companyLinkedInUrl || c.companyWorkEmail)
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-2xl text-brand-foreground tracking-tight">
          Company Verifications
        </h1>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-white overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border">
              {["Company", "Recruiter", "Submission", "Status", "Updated", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-brand-foreground-muted"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {companies.map((item) => (
              <CompanyRow
                key={item.id}
                item={item}
                onApprove={() => handleReview(item.id, "approve")}
                onReject={() => handleReview(item.id, "reject")}
                isPending={pendingId === item.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
