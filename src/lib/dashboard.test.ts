import { describe, expect, it } from "vitest";

import { dashboardFigures, periodFromParam, type DashboardApplication } from "./dashboard";

const now = new Date(2026, 8, 28, 12);
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);
const app = (id: string, extra: Partial<DashboardApplication> = {}): DashboardApplication => ({
  id,
  status: "SENT",
  furthestStage: "SENT",
  archived: false,
  sentAt: daysAgo(2),
  createdAt: daysAgo(3),
  ...extra,
});

describe("dashboard figures", () => {
  it("counts furthest stages and outcomes, including archived applications", () => {
    const figures = dashboardFigures([
      app("draft", { status: "DRAFT", furthestStage: null, sentAt: null }),
      app("sent"),
      app("archived", { archived: true }),
      app("rejected", { status: "REJECTED", furthestStage: "SCREENING" }),
      app("declined", { status: "DECLINED", furthestStage: "OFFER" }),
    ], now);
    expect(figures.total).toBe(5);
    expect(figures.funnel.map((step) => step.count)).toEqual([4, 2, 1, 1, 0]);
    expect(figures.funnel[0].stopped).toEqual({ open: 1, archived: 1, rejected: 0, declined: 0 });
    expect(figures.byStatus).toMatchObject({ DRAFT: 1, SENT: 2, REJECTED: 1, DECLINED: 1 });
    expect(figures).toMatchObject({ sent: 4, heardBack: 2, heardBackPercent: 50, reachedInterview: 1 });
  });

  it("keeps all-time total while limiting period counts and activity", () => {
    const applications = [
      app("new", { createdAt: daysAgo(5), sentAt: daysAgo(4), furthestStage: "SCREENING", status: "SCREENING" }),
      app("month", { createdAt: daysAgo(40), sentAt: daysAgo(38) }),
      app("old", { createdAt: daysAgo(200), sentAt: null, furthestStage: null, status: "DRAFT" }),
    ];
    const month = dashboardFigures(applications, now, { period: "30d" });
    expect(month.total).toBe(3);
    expect(month.sent).toBe(1);
    expect(Object.values(month.byStatus).reduce((sum, count) => sum + count, 0)).toBe(1);
    expect(month.weeks.reduce((sum, week) => sum + week.created, 0)).toBe(1);
    expect(dashboardFigures(applications, now, { period: "90d" }).sent).toBe(2);
    expect(periodFromParam("90d")).toBe("90d");
    expect(periodFromParam("7d")).toBeNull();
  });

  it("counts started and sent dates by week and caps history at a year", () => {
    const weeks = dashboardFigures([
      app("a", { createdAt: new Date(2026, 8, 28, 9), sentAt: null }),
      app("b", { createdAt: new Date(2026, 8, 22), sentAt: new Date(2026, 8, 27, 23) }),
      app("c", { createdAt: new Date(2026, 8, 21), sentAt: new Date(2026, 8, 28, 10) }),
    ], now, { period: "30d" }).weeks;
    expect(weeks.at(-2)).toMatchObject({ created: 2, sent: 1 });
    expect(weeks.at(-1)).toMatchObject({ created: 1, sent: 1 });
    expect(dashboardFigures([app("old", { createdAt: new Date(2024, 0, 3) })], now).weeks).toHaveLength(52);
    expect(dashboardFigures([], now).weeks).toEqual([]);
  });
});
