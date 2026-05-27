import { AdminCompaniesList } from "@/modules/admin/components/AdminCompaniesList";

/*
 * /admin/companies
 * Server entry for the admin company verification review page.
 * Auth is enforced by the shared AdminLayout (layout.tsx).
 */
export default function AdminCompaniesPage() {
  return <AdminCompaniesList />;
}
