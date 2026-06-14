import { format } from "date-fns";
import { PlanTier } from "@/constants/enums";

/*
 * CompanyRow
 * Shape expected by AdminCompaniesTable for each recruiter/company entry.
 */
interface CompanyRow {
  id: string;
  companyName: string;
  email: string;
  plan: PlanTier;
  signupDate: string; // ISO string — formatted by date-fns in cell
  openJobs: number;
  isActive: boolean;
}

/*
 * AdminCompaniesTableProps
 * Props contract for the table — pass the mapped CompanyRow array from the page.
 */
interface AdminCompaniesTableProps {
  companies: CompanyRow[];
}

/** Repeated cell base className — extracted to avoid duplication. */
const CELL_BASE = "px-4 py-3 text-sm text-brand-foreground";

/** Muted cell — for secondary info columns. */
const CELL_MUTED = "px-4 py-3 text-sm text-brand-foreground-muted";

/*
 * AdminCompaniesTable
 * Presentational server component — renders a paginated recruiter/company list
 * matching the verification-queue table visual style.
 *
 * Columns: Company, Email, Plan, Signup, Open Jobs, Status.
 * Handles the empty state with a centred "No companies yet." message.
 *
 * @param companies - Array of CompanyRow objects to render.
 * @returns A styled table or an empty-state placeholder.
 */
export function AdminCompaniesTable({ companies }: AdminCompaniesTableProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-white">
      {companies.length === 0 ? (
        <div className="p-10 text-center text-brand-foreground-muted">
          No companies yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Signup</th>
                <th className="px-4 py-3">Open Jobs</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-brand-border">
                  <td className={CELL_BASE}>{c.companyName}</td>
                  <td className={CELL_MUTED}>{c.email}</td>
                  <td className={CELL_BASE}>{c.plan}</td>
                  <td className={CELL_MUTED}>
                    {format(new Date(c.signupDate), "MMM d, yyyy")}
                  </td>
                  <td className={CELL_MUTED}>{c.openJobs}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.isActive
                          ? "text-sm font-medium text-brand-success"
                          : "text-sm font-medium text-brand-foreground-muted"
                      }
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
