import { format } from "date-fns";
import { PlanTier } from "@/constants/enums";
import { PLAN_TIER_DISPLAY } from "@/modules/admin/utils/status-display";
import { AdminBadge } from "@/modules/admin/components/AdminBadge";

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

/** Repeated cell base className. */
const CELL_BASE = "px-4 py-3.5 text-sm text-brand-foreground";

/** Muted cell — for secondary info columns. */
const CELL_MUTED = "px-4 py-3.5 text-sm text-brand-foreground-muted";

/*
 * AdminCompaniesTable
 * Presentational server component — renders a paginated recruiter/company list
 * with colored plan + active/inactive badges. Borders/tints only (no shadow,
 * no dark mode). Handles the empty state with a centred message.
 *
 * @param companies - Array of CompanyRow objects to render.
 * @returns A styled table or an empty-state placeholder.
 */
export function AdminCompaniesTable({ companies }: AdminCompaniesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
      {companies.length === 0 ? (
        <div className="p-12 text-center text-sm text-brand-foreground-muted">
          No companies yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-brand-border bg-brand-surface text-left text-xs uppercase tracking-wider text-brand-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Signup</th>
                <th className="px-4 py-3 font-medium">Open jobs</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const planDisplay = PLAN_TIER_DISPLAY[c.plan];
                return (
                  <tr
                    key={c.id}
                    className="border-t border-brand-border transition-colors hover:bg-brand-surface"
                  >
                    <td className={`${CELL_BASE} font-medium`}>
                      {c.companyName}
                    </td>
                    <td className={CELL_MUTED}>{c.email}</td>
                    <td className="px-4 py-3.5">
                      <AdminBadge
                        label={planDisplay.label}
                        className={planDisplay.badge}
                      />
                    </td>
                    <td className={CELL_MUTED}>
                      {format(new Date(c.signupDate), "MMM d, yyyy")}
                    </td>
                    <td className={CELL_MUTED}>{c.openJobs}</td>
                    <td className="px-4 py-3.5">
                      <AdminBadge
                        label={c.isActive ? "Active" : "Inactive"}
                        className={
                          c.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-brand-border bg-gray-50 text-gray-500"
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
