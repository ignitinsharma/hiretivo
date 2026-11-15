import type { Metadata } from "next";
import { periodFromParam } from "@/lib/dashboard";
import { loadDashboard, loadRecentDashboardApplications } from "@/lib/dashboard-data";
import { dayPeriod, hourIn } from "@/lib/greeting";
import { loadProfileName } from "@/lib/profile-data";
import { loadSettings } from "@/lib/settings-data";
import { userTimeZone } from "@/lib/time-zone";

import { Dashboard } from "../dashboard";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Where the search stands (PRD §6.7). Read fresh on every visit, so a status
 * change anywhere shows at once (DSH-6). `?period=` picks the time filter,
 * else the one last used (E9-8). Interview times show in the browser's time
 * zone (E9-9).
 */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ period: param }, settings, timeZone] = await Promise.all([searchParams, loadSettings(), userTimeZone()]);
  const range = periodFromParam(param) ?? settings.dashboardPeriod;
  const [figures, name, recent] = await Promise.all([
    loadDashboard({ period: range }),
    loadProfileName(),
    loadRecentDashboardApplications({ period: range }),
  ]);
  return (
    <Dashboard
      figures={figures}
      recent={recent}
      firstName={name.trim().split(/\s+/)[0] ?? ""}
      period={dayPeriod(hourIn(timeZone))}
      range={range}
      empty={figures.total === 0}
    />
  );
}
