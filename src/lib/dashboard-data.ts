import "server-only";

import { DASHBOARD_PERIODS, dashboardFigures, type DashboardFigures, type DashboardOptions } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

/**
 * Every dashboard figure, from all applications, archived ones included,
 * scoped to the selected period.
 */
export async function loadDashboard(options: DashboardOptions = {}, now = new Date()): Promise<DashboardFigures> {
  // Agent drafts count once they're approved (#195).
  const applications = await prisma.application.findMany({
    where: { awaitingReview: false },
    select: {
      id: true,
      status: true,
      furthestStage: true,
      archivedAt: true,
      sentAt: true,
      createdAt: true,
    },
  });
  return dashboardFigures(
    applications.map((application) => ({
      id: application.id,
      status: application.status,
      furthestStage: application.furthestStage,
      archived: application.archivedAt !== null,
      sentAt: application.sentAt,
      createdAt: application.createdAt,
    })),
    now,
    options,
  );
}

export type RecentDashboardApplication = { id: string; company: string; role: string; status: import("@/generated/prisma/enums").ApplicationStatus; date: string };

export async function loadRecentDashboardApplications(options: DashboardOptions = {}, now = new Date()): Promise<RecentDashboardApplication[]> {
  const days = DASHBOARD_PERIODS.find((entry) => entry.value === options.period)?.days ?? null;
  const rows = await prisma.application.findMany({
    where: { awaitingReview: false, archivedAt: null, ...(days === null ? {} : { createdAt: { gte: new Date(now.getTime() - days * 86_400_000) } }) },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 3,
    select: { id: true, company: true, role: true, title: true, status: true, sentAt: true, updatedAt: true },
  });
  return rows.map((row) => ({ id: row.id, company: row.company.trim() || "Company not specified", role: row.role.trim() || row.title.trim() || "Untitled application", status: row.status,
    date: `${row.sentAt ? "Sent" : "Updated"} ${(row.sentAt ?? row.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` }));
}
