"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/Pagination";
import { LogoPreview } from "./LogoPreview";
import { JobStatusBadge } from "@/components/shared/JobStatusBadge";
import { useAdminJobs } from "../hooks/use-admin-jobs";
import { usePublishAdminJob, useDeleteAdminJob } from "../hooks/use-admin-mutations";
import { JobStatus } from "@/constants/enums";
import type { AdminJobListItem } from "../types/admin-job.types";

const PAGE_SIZE = 20;

/*
 * AdminJobList
 * Table view of admin-posted jobs with server-side offset pagination (20/page).
 * Provides status filter, publish, edit, and delete actions.
 * Resetting currentPage to 1 on status change prevents empty-page states.
 */
export function AdminJobList() {
  const [status, setStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminJobs(
    status === "ALL" ? undefined : status,
    currentPage,
  );

  const publishMut = usePublishAdminJob();
  const deleteMut = useDeleteAdminJob();

  /*
   * handleStatusChange
   * Updates the status filter and resets to page 1 to avoid empty-page states.
   */
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  /*
   * onPublish
   * Fires the publish mutation for a single row and scopes the loading state
   * to only that row via pendingId.
   */
  const onPublish = async (id: string) => {
    setPendingId(id);
    try {
      await publishMut.mutateAsync(id);
      toast.success("Published");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Publish failed";
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  };

  /*
   * confirmDelete
   * Called after the AlertDialog confirmation. Runs delete mutation and clears
   * pending/target state.
   */
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setPendingId(id);
    setDeleteTargetId(null);
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Delete failed";
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  };

  const pagination = data?.pagination;
  const jobs = data?.jobs ?? [];
  const showStart = pagination ? Math.min((currentPage - 1) * PAGE_SIZE + 1, pagination.total) : 0;
  const showEnd = pagination ? Math.min(currentPage * PAGE_SIZE, pagination.total) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-bold text-2xl text-brand-foreground">Admin jobs</h1>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value={JobStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={JobStatus.OPEN}>Open</SelectItem>
              <SelectItem value={JobStatus.PAUSED}>Paused</SelectItem>
              <SelectItem value={JobStatus.CLOSED}>Closed</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/admin/jobs/new">
            <Button variant="primary">New job</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white">
        {isLoading && (
          <div className="p-8 text-center text-brand-foreground-muted">Loading…</div>
        )}
        {isError && (
          <div className="p-8 text-center text-brand-danger">Failed to load</div>
        )}
        {!isLoading && !isError && jobs.length === 0 && (
          <div className="p-8 text-center text-brand-foreground-muted">
            No jobs yet —{" "}
            <Link href="/admin/jobs/new" className="text-brand-primary">
              create one
            </Link>
          </div>
        )}
        {!isLoading && !isError && jobs.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
                  <tr>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Applicants</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j: AdminJobListItem) => {
                    const rowPending = pendingId === j.id;
                    return (
                      <tr key={j.id} className="border-t border-brand-border">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <LogoPreview
                              url={j.companyLogoUrl ?? ""}
                              companyName={j.companyName ?? "?"}
                              size={32}
                            />
                            <span className="text-sm text-brand-foreground">
                              {j.companyName ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-foreground">{j.title}</td>
                        <td className="px-4 py-3">
                          <JobStatusBadge status={j.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                          {j.applicantCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                          {format(new Date(j.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <Link href={`/admin/jobs/${j.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          {j.status === JobStatus.DRAFT && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onPublish(j.id)}
                              disabled={rowPending}
                            >
                              {rowPending && publishMut.isPending ? "Publishing…" : "Publish"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTargetId(j.id)}
                            disabled={rowPending}
                          >
                            {rowPending && deleteMut.isPending ? "Deleting…" : "Delete"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-brand-border bg-brand-surface">
              <p className="text-xs text-brand-foreground-muted">
                Showing{" "}
                <span className="font-semibold text-brand-foreground">{showStart}</span>
                –
                <span className="font-semibold text-brand-foreground">{showEnd}</span>{" "}
                of{" "}
                <span className="font-semibold text-brand-foreground">{pagination?.total ?? 0}</span>
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination?.totalPages ?? 1}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              The job will be soft-deleted and removed from the seeker feed.
              You can recreate it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
