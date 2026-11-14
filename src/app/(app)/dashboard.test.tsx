import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardFigures, WeekActivity } from "@/lib/dashboard";

import { Dashboard } from "./dashboard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => null, useSearchParams: () => new URLSearchParams() }));
vi.mock("./actions", () => ({ rememberDashboardPeriod: vi.fn() }));

const week = (day: number, created: number, sent: number): WeekActivity => ({ start: new Date(2026, 8, day), created, sent });
const figures: DashboardFigures = {
  total: 1,
  byStatus: { DRAFT: 0, SENT: 1, SCREENING: 0, INTERVIEW: 0, OFFER: 0, ACCEPTED: 0, REJECTED: 0, DECLINED: 0 },
  funnel: [
    { stage: "SENT", count: 1, conversion: null, stopped: { open: 1, rejected: 0, declined: 0, archived: 0 } },
    { stage: "SCREENING", count: 0, conversion: 0, stopped: { open: 0, rejected: 0, declined: 0, archived: 0 } },
    { stage: "INTERVIEW", count: 0, conversion: null, stopped: { open: 0, rejected: 0, declined: 0, archived: 0 } },
    { stage: "OFFER", count: 0, conversion: null, stopped: { open: 0, rejected: 0, declined: 0, archived: 0 } },
    { stage: "ACCEPTED", count: 0, conversion: null, stopped: { open: 0, rejected: 0, declined: 0, archived: 0 } },
  ],
  sent: 1,
  heardBack: 0,
  heardBackPercent: 0,
  reachedInterview: 0,
  weeks: [week(7, 1, 1)],
};
const props = { figures, firstName: "Jane", period: "afternoon" as const, empty: false };

afterEach(() => vi.useRealTimers());

describe("dashboard with sparse activity", () => {
  it("welcomes someone with no applications", () => {
    render(<Dashboard {...props} empty figures={{ ...figures, total: 0, sent: 0 }} />);
    expect(screen.getByRole("heading", { name: "Welcome to Hiretivo" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your funnel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Week by week" })).not.toBeInTheDocument();
  });

  it("shows a useful summary for one application, without sparse charts or removed cards", () => {
    render(<Dashboard {...props} />);
    const overview = screen.getByRole("region", { name: "Your applications" });
    expect(within(overview).getByText("1 application in this period")).toBeInTheDocument();
    expect(within(overview).getByRole("link", { name: "Open board" })).toHaveAttribute("href", "/applications?view=board");
    expect(within(overview).getAllByRole("listitem")).toHaveLength(1);
    expect(within(overview).getByText("Sent").closest("li")).toHaveTextContent("Sent1");
    expect(screen.queryByRole("region", { name: "Your funnel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Week by week" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Worth a look" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Calendar" })).not.toBeInTheDocument();
  });

  it("keeps the compact view with two sent applications in two weeks", () => {
    render(<Dashboard {...props} figures={{ ...figures, total: 2, byStatus: { ...figures.byStatus, SENT: 2 }, sent: 2, weeks: [week(7, 1, 1), week(14, 1, 1)] }} />);
    expect(screen.getByText("2 applications in this period")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your funnel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Week by week" })).not.toBeInTheDocument();
  });

  it("shows an empty period with a way back to all time", () => {
    const noPeriodActivity = { ...figures, byStatus: Object.fromEntries(Object.keys(figures.byStatus).map((status) => [status, 0])) as DashboardFigures["byStatus"], sent: 0, weeks: [] };
    render(<Dashboard {...props} figures={noPeriodActivity} range="30d" />);
    expect(screen.getByRole("heading", { name: "No applications in this period" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show all time" })).toHaveAttribute("href", "/?period=all");
    expect(screen.queryByRole("region", { name: "Your applications" })).not.toBeInTheDocument();
  });

  it("shows the funnel at three sent applications and the weekly chart at three active weeks", () => {
    const threeSent = { ...figures, total: 3, byStatus: { ...figures.byStatus, SENT: 3 }, sent: 3, funnel: figures.funnel.map((step, index) => index === 0 ? { ...step, count: 3, stopped: { ...step.stopped, open: 3 } } : step) };
    const { rerender } = render(<Dashboard {...props} figures={threeSent} />);
    expect(screen.getByRole("region", { name: "Your funnel" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Week by week" })).not.toBeInTheDocument();

    const threeWeeks = { ...figures, total: 3, byStatus: { ...figures.byStatus, DRAFT: 2 }, weeks: [week(7, 1, 1), week(14, 1, 0), week(21, 1, 0)] };
    rerender(<Dashboard {...props} figures={threeWeeks} />);
    expect(screen.queryByRole("region", { name: "Your funnel" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Week by week" })).toBeInTheDocument();

    rerender(<Dashboard {...props} figures={{ ...threeSent, weeks: threeWeeks.weeks }} />);
    expect(screen.getByRole("region", { name: "Your funnel" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Week by week" })).toBeInTheDocument();
  });

  it("keeps the greeting and new application action", () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 28, 9), toFake: ["Date"] });
    render(<Dashboard {...props} />);
    expect(screen.getByRole("heading", { level: 1, name: "Good morning, Jane" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New application" })).toHaveAttribute("href", "/new?fresh=1");
  });
});
