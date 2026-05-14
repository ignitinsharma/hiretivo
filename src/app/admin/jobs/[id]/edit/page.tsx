"use client";

import { useAdminJob } from "@/modules/admin/hooks/use-admin-job";
import { AdminJobForm } from "@/modules/admin/components/AdminJobForm";

/*
 * /admin/jobs/[id]/edit
 * Loads an existing admin job and reuses AdminJobForm in edit mode.
 * Next.js 14: params is a plain object, not a Promise — no use() needed.
 */
export default function EditAdminJobPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data, isLoading, isError } = useAdminJob(id);

  if (isLoading) {
    return <div className="p-8 text-center text-brand-foreground-muted">Loading…</div>;
  }
  if (isError || !data?.job) {
    return <div className="p-8 text-center text-brand-danger">Not found</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl text-brand-foreground">Edit job</h1>
      <AdminJobForm existing={data.job} />
    </div>
  );
}
