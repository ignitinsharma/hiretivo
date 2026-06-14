import { getOverviewStats } from "@/modules/admin/utils/get-overview-stats";
import { AdminOverviewStats } from "@/modules/admin/components/AdminOverviewStats";

/*
 * /admin
 * Admin landing dashboard (server component). Calls the shared getOverviewStats
 * aggregate builder and renders the stat-card overview. Layout (admin/layout.tsx)
 * enforces admin auth — this page does not re-check. A query failure is caught by
 * the co-located error.tsx boundary.
 */
export default async function AdminOverviewPage() {
  const stats = await getOverviewStats();
  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl text-brand-foreground">Overview</h1>
      <AdminOverviewStats stats={stats} />
    </div>
  );
}
