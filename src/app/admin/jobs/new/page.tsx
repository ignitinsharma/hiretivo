import { AdminJobForm } from "@/modules/admin/components/AdminJobForm";

/*
 * /admin/jobs/new
 * Form for creating a new admin job (draft + publish workflow).
 */
export default function NewAdminJobPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-bold text-2xl text-brand-foreground">New job</h1>
      <AdminJobForm />
    </div>
  );
}
