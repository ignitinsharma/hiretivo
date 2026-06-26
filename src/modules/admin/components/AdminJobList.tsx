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

interface JobRowProps {
  job: AdminJobListItem;
  pendingId: string | null;
  publishMut: ReturnType<typeof usePublishAdminJob>;
  deleteMut: ReturnType<typeof useDeleteAdminJob>;
  onPublish: (id: string) => Promise<void>;
  setDeleteTargetId: (id: string | null) => void;
}

function JobRow({ job, pendingId, publishMut, deleteMut, onPublish, setDeleteTargetId }: JobRowProps) {
  const rowPending = pendingId === job.id;

  return (
    <tr key={job.id} className="border-t border-brand-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <LogoPreview
            url={job.companyLogoUrl ?? ""}
            companyName={job.companyName ?? "?"}
            size={32}
          />
          <span className="text-sm text-brand-foreground">
            {job.companyName ?? "—"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-brand-foreground">{job.title}</td>
      <td className="px-4 py-3">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-sm text-brand-foreground-muted">
        {job.applicantCount}
      </td>
      <td className="px-4 py-3 text-sm text-brand-foreground-muted">
        {format(new Date(job.createdAt), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
        <Link href={`/admin/jobs/${job.id}/edit`}>
          <Button variant="ghost" size="sm">Edit</Button>
        </Link>
        {job.status === JobStatus.DRAFT && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPublish(job.id)}
            disabled={rowPending}
          >
            {rowPending && publishMut.isPending ? "Publishing…" : "Publish"}
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteTargetId(job.id)}
          disabled={rowPending}
        >
          {rowPending && deleteMut.isPending ? "Deleting…" : "Delete"}
        </Button>
      </td>
    </tr>
  );
}

interface PaginationFooterProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  total: number;
  totalPages: number;
  limit: number;
}

function PaginationFooter({ currentPage, onPageChange, total, totalPages, limit }: PaginationFooterProps) {
  const showStart = Math.min((currentPage - 1) * limit + 1, total);
  const showEnd = Math.min(currentPage * limit, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-brand-border bg-brand-surface">
      <p className="text-xs text-brand-foreground-muted">
        Showing{" "}
        <span className="font-semibold text-brand-foreground">{showStart}</span>
        –
        <span className="font-semibold text-brand-foreground">{showEnd}</span>{" "}
        of{" "}
        <span className="font-semibold text-brand-foreground">{total}</span>
      </p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

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

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

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
                  {jobs.map((j) => (
                    <JobRow
                      key={j.id}
                      job={j}
                      pendingId={pendingId}
                      publishMut={publishMut}
                      deleteMut={deleteMut}
                      onPublish={onPublish}
                      setDeleteTargetId={setDeleteTargetId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              total={pagination?.total ?? 0}
              totalPages={pagination?.totalPages ?? 1}
              limit={pagination?.limit ?? PAGE_SIZE}
            />
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
