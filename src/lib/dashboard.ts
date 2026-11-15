import { ApplicationStatus, FunnelStage } from "@/generated/prisma/enums";
import { FUNNEL_STAGES, STATUSES } from "@/lib/status";

// Every dashboard figure (E9-6, PRD §6.7 and §8), worked out on the server
// from the applications, so the dashboard only draws them.

/** What the dashboard needs to know about an application. */
export type DashboardApplication = {
  id: string;
  status: ApplicationStatus;
  furthestStage: FunnelStage | null;
  archived: boolean;
  sentAt: Date | null;
  createdAt: Date;
};

/**
 * Where an application that went no further than a stage is now: still
 * open, rejected, declined, or archived while it was still open.
 */
export type FunnelOutcome = "open" | "rejected" | "declined" | "archived";
/** The outcomes, in the order the funnel draws them. */
export const FUNNEL_OUTCOMES: readonly FunnelOutcome[] = ["open", "rejected", "declined", "archived"];

export type FunnelStep = {
  stage: FunnelStage;
  count: number;
  /** Percent of the previous stage, rounded; null for Sent or when the previous stage is empty. */
  conversion: number | null;
  /**
   * The applications that got this far and no further, by outcome. Accepted
   * is the end of the funnel, so it has none: they all count as accepted.
   */
  stopped: Record<FunnelOutcome, number>;
};

/** One week of the activity chart (E9-8): applications started and sent in it. */
export type WeekActivity = {
  /** The Monday the week starts on, in the server's time zone. */
  start: Date;
  created: number;
  sent: number;
};

/** The dashboard's time filter (E9-8, DSH-7). */
export const DASHBOARD_PERIODS = [
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]["value"];

/** "30d" from `?period=`, or null for anything else. */
export function periodFromParam(value: unknown): DashboardPeriod | null {
  return DASHBOARD_PERIODS.find((period) => period.value === value)?.value ?? null;
}

/** The activity chart shows at most a year of weeks. */
const MAX_WEEKS = 52;

export type DashboardFigures = {
  /** Every application, whatever the period: none at all means the welcome. */
  total: number;
  /** How many applications are in each status now, all eight. */
  byStatus: Record<ApplicationStatus, number>;
  /**
   * Sent → Accepted by the furthest stage reached, so closed applications
   * count where they got to (DSH-3), and how the ones that stopped ended.
   */
  funnel: FunnelStep[];
  sent: number;
  heardBack: number;
  /** Heard back ÷ sent, rounded; null before anything was sent. */
  heardBackPercent: number | null;
  reachedInterview: number;
  /** The period's applications by the week they were started and sent, oldest first. */
  weeks: WeekActivity[];
};

export type DashboardOptions = {
  period?: DashboardPeriod;
};

const DAY_MS = 86_400_000;
const rank = (stage: FunnelStage | null) => (stage === null ? -1 : FUNNEL_STAGES.indexOf(stage));

/** A closed status says how it ended; an open one archived means it was let go (decided 16 October 2026). */
function outcome({ status, archived }: DashboardApplication): FunnelOutcome {
  if (status === ApplicationStatus.REJECTED) return "rejected";
  if (status === ApplicationStatus.DECLINED) return "declined";
  return archived ? "archived" : "open";
}

/**
 * Archived applications count in the funnel and status breakdown. With a
 * period, the figures count applications created in that period.
 */
export function dashboardFigures(
  all: readonly DashboardApplication[],
  now = new Date(),
  { period = "all" }: DashboardOptions = {},
): DashboardFigures {
  const days = DASHBOARD_PERIODS.find((entry) => entry.value === period)?.days ?? null;
  const since = days === null ? null : now.getTime() - days * DAY_MS;
  const applications = since === null ? all : all.filter((application) => application.createdAt.getTime() >= since);

  const byStatus = Object.fromEntries(STATUSES.map(({ value }) => [value, 0])) as Record<ApplicationStatus, number>;
  for (const application of applications) byStatus[application.status] += 1;

  const reached = (stage: FunnelStage) => applications.filter((application) => rank(application.furthestStage) >= rank(stage)).length;
  const funnel = FUNNEL_STAGES.map((stage, index): FunnelStep => {
    const count = reached(stage);
    const previous = index > 0 ? reached(FUNNEL_STAGES[index - 1]) : 0;
    const stopped = Object.fromEntries(FUNNEL_OUTCOMES.map((key) => [key, 0])) as Record<FunnelOutcome, number>;
    if (index < FUNNEL_STAGES.length - 1) {
      for (const application of applications) if (application.furthestStage === stage) stopped[outcome(application)] += 1;
    }
    return { stage, count, conversion: index > 0 && previous > 0 ? Math.round((count / previous) * 100) : null, stopped };
  });
  const sent = reached(FunnelStage.SENT);
  const heardBack = reached(FunnelStage.SCREENING);

  return {
    total: all.length,
    byStatus,
    funnel,
    sent,
    heardBack,
    heardBackPercent: sent > 0 ? Math.round((heardBack / sent) * 100) : null,
    reachedInterview: reached(FunnelStage.INTERVIEW),
    weeks: weeklyActivity(applications, now, since),
  };
}

/** The Monday of a date's week, at midnight in the server's time zone. */
function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/**
 * The period's applications (the same ones the funnel counts) by the week
 * they were created and the week they were sent, from the week the period
 * starts (or the first application's, for all time) to this one, at most a
 * year.
 */
function weeklyActivity(applications: readonly DashboardApplication[], now: Date, since: number | null): WeekActivity[] {
  if (applications.length === 0) return [];
  const first = since ?? Math.min(...applications.map((application) => application.createdAt.getTime()));
  const weeks: WeekActivity[] = [];
  for (let start = weekStart(new Date(first)); start <= now; start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)) {
    weeks.push({ start, created: 0, sent: 0 });
  }
  const recent = weeks.slice(-MAX_WEEKS);
  const indexOf = (date: Date) => recent.findIndex((week, index) => date >= week.start && (index === recent.length - 1 || date < recent[index + 1].start));
  for (const application of applications) {
    const created = indexOf(application.createdAt);
    if (created >= 0) recent[created].created += 1;
    const sent = application.sentAt ? indexOf(application.sentAt) : -1;
    if (sent >= 0) recent[sent].sent += 1;
  }
  return recent;
}
