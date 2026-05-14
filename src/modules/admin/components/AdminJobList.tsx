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
import { LogoPreview } from "./LogoPreview";
import { useAdminJobs } from "../hooks/use-admin-jobs";
import { usePublishAdminJob, useDeleteAdminJob } from "../hooks/use-admin-mutations";
import { JobStatus } from "@/constants/enums";
import type { AdminJobListItem } from "../types/admin-job.types";

const STATUS_LABEL: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: "Draft",
  [JobStatus.OPEN]: "Open",
  [JobStatus.PAUSED]: "Paused",
  [JobStatus.CLOSED]: "Closed",
  [JobStatus.UNPUBLISHED]: "Unpublished",
  [JobStatus.DELETED]: "Deleted",
};

const STATUS_COLOR: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: "bg-brand-surface text-brand-foreground-muted",
  [JobStatus.OPEN]: "bg-green-100 text-green-700",
  [JobStatus.PAUSED]: "bg-amber-100 text-amber-700",
  [JobStatus.CLOSED]: "bg-gray-100 text-gray-700",
  [JobStatus.UNPUBLISHED]: "bg-gray-100 text-gray-500",
  [JobStatus.DELETED]: "bg-red-100 text-red-700",
};

/*
 * AdminJobList
 * Table view of admin-posted jobs. Provides status filter, publish, edit, delete actions.
 * Fetches jobs via useAdminJobs with an optional status filter.
 * Publish transitions DRAFT → OPEN; Delete soft-deletes the job.
 */
export function AdminJobList() {
  const [status, setStatus] = useState<string>("ALL");
  const { data, isLoading, isError } = useAdminJobs(status === "ALL" ? undefined : status);
  const publishMut = usePublishAdminJob();
  const deleteMut = useDeleteAdminJob();

  const onPublish = async (id: string) => {
    try {
      await publishMut.mutateAsync(id);
      toast.success("Published");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Publish failed";
      toast.error(msg);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Delete failed";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl text-brand-foreground">Admin jobs</h1>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
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

      <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-brand-foreground-muted">Loading…</div>
        )}
        {isError && (
          <div className="p-8 text-center text-brand-danger">Failed to load</div>
        )}
        {!isLoading && !isError && (data?.jobs?.length ?? 0) === 0 && (
          <div className="p-8 text-center text-brand-foreground-muted">
            No jobs yet —{" "}
            <Link href="/admin/jobs/new" className="text-brand-primary">
              create one
            </Link>
          </div>
        )}
        {!isLoading && !isError && (data?.jobs?.length ?? 0) > 0 && (
          <table className="w-full">
            <thead className="bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data!.jobs.map((j: AdminJobListItem) => (
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
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_COLOR[j.status] ?? ""}`}
                    >
                      {STATUS_LABEL[j.status] ?? j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-foreground-muted">
                    {format(new Date(j.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
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
                        disabled={publishMut.isPending}
                      >
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(j.id)}
                      disabled={deleteMut.isPending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
