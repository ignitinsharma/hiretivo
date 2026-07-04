import { CreditsBanner } from "@/modules/seeker/dashboard/components/CreditsBanner";
import { TopMatchesRow } from "@/modules/seeker/dashboard/components/TopMatchesRow";
import { ApplicationsTable } from "@/modules/seeker/dashboard/components/ApplicationsTable";

/*
 * DashboardPage
 * Seeker home (Section B rebuild) — credits banner, top job matches, and the
 * full applications table. No greeting/profile-strength/quick-stats — the
 * pivot dashboard is apply-activity-first, ditto the Tsenta layout.
 */
export default function DashboardPage() {
  return (
    <div>
      <CreditsBanner />
      <TopMatchesRow />
      <ApplicationsTable />
    </div>
  );
}
