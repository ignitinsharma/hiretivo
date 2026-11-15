import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { buttonClassName } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { DASHBOARD_PERIODS, type DashboardFigures, type DashboardPeriod } from "@/lib/dashboard";
import type { DayPeriod } from "@/lib/greeting";
import type { RecentDashboardApplication } from "@/lib/dashboard-data";
import { STATUSES } from "@/lib/status";

import { ActivityChart } from "./activity-chart";
import { FunnelChart } from "./funnel-chart";
import { Greeting } from "./greeting";
import { PeriodFilter, PeriodScoped } from "./period-filter";

const card = "flex flex-col rounded-panel border border-line-card bg-card";
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Show useful counts before there is enough activity for trend charts. */
export function Dashboard({
  figures,
  firstName,
  period,
  range = "all",
  empty,
  recent = [],
}: {
  figures: DashboardFigures;
  firstName: string;
  period: DayPeriod;
  /** The time filter (E9-8). */
  range?: DashboardPeriod;
  /** No applications at all yet. */
  empty: boolean;
  recent?: RecentDashboardApplication[];
}) {
  const { sent, heardBack } = figures;
  const periodCount = Object.values(figures.byStatus).reduce((total, count) => total + count, 0);
  const activeWeeks = figures.weeks.filter((week) => week.created > 0 || week.sent > 0).length;
  // The summary follows the time filter, so it says which period it covers.
  const within = range === "all" ? null : DASHBOARD_PERIODS.find((entry) => entry.value === range)?.label.toLowerCase();
  return (
    <>
      <PageHeader
        title={<Greeting name={firstName} serverPeriod={period} />}
        description={
          sent > 0
            ? heardBack > 0
              ? `${within ? `In the ${within} you've` : "You've"} sent ${plural(sent, "application", "applications")} and heard back from ${heardBack}.`
              : `${within ? `In the ${within} you've` : "You've"} sent ${plural(sent, "application", "applications")}. Waiting to hear back.`
            : within
              ? `Nothing sent in the ${within}. Your next application is only a paste away.`
              : "Nothing sent yet. Your first application is only a paste away."
        }
        actions={
          <Link href="/new?fresh=1" className={buttonClassName("primary", "md", "hover:text-on-primary")}>
            + New application
          </Link>
        }
      />

      {empty ? (
        <div className="px-10 pb-[72px]"><Welcome /></div>
      ) : (
        <PeriodFilter period={range}>
          <div className="px-10 pb-[72px]">
            <PeriodScoped className="flex max-w-[1200px] flex-col gap-5">
              {periodCount === 0 ? (
                <EmptyPeriod range={range} />
              ) : (
                <>
                  <section aria-label="Application progress" className={`${card} p-7 gap-5`}>
                    <h2 className="text-subsection">Your progress</h2>
                    <dl className="grid grid-cols-3 gap-4">
                      <Figure value={String(sent)} label="Sent" />
                      <Figure value={String(heardBack)} label="Heard back" />
                      <Figure value={String(figures.reachedInterview)} label="Reached interview" />
                    </dl>
                  </section>
                  {recent.length > 0 ? <section aria-label="Recent applications" className={`${card} p-7 gap-4`}>
                    <div className="flex justify-between gap-4"><h2 className="text-subsection">Recent applications</h2><Link href="/applications" className="text-sm underline">View all</Link></div>
                    <ul className="divide-y divide-line">{recent.map((application) => <li key={application.id}>
                      <Link href={`/applications/${application.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-primary">
                        <span className="flex flex-col gap-1"><strong className="font-medium">{application.role}</strong><span className="text-sm text-muted">{application.company}</span></span>
                        <span className="flex items-center gap-3 text-sm"><StatusDot status={application.status} />{STATUSES.find((status) => status.value === application.status)?.label}<span className="text-muted">{application.date}</span></span>
                      </Link>
                    </li>)}</ul>
                  </section> : null}
                  <ApplicationOverview byStatus={figures.byStatus} count={periodCount} />
                  {sent >= 3 ? <Funnel figures={figures} /> : null}
                  {activeWeeks >= 3 ? <ActivityChart weeks={figures.weeks} /> : null}
                </>
              )}
            </PeriodScoped>
          </div>
        </PeriodFilter>
      )}
    </>
  );
}

function EmptyPeriod({ range }: { range: DashboardPeriod }) {
  return (
    <section className={`${card} items-start gap-3 p-7`}>
      <h2 className="text-section text-primary-text">No applications in this period</h2>
      <p className="text-sm text-muted">Your applications from other dates are still available.</p>
      {range !== "all" ? <Link href="/?period=all" className={buttonClassName("secondary")}>Show all time</Link> : null}
    </section>
  );
}

/** "Your funnel" (DSH-2): how far every sent application got, closed ones included, as a Sankey diagram. */
function Funnel({ figures }: { figures: DashboardFigures }) {
  const { funnel, sent, heardBackPercent, reachedInterview } = figures;
  return (
    <section aria-labelledby="funnel-heading" className={`${card} col-span-full gap-6 p-7`}>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="funnel-heading" className="text-section text-primary-text">
            Your funnel
          </h2>
          <p className="text-control text-muted">How far each application you&apos;ve sent has made it, and where the ones that stopped are now.</p>
        </div>
        <dl className="flex gap-7">
          <Figure value={String(sent)} label="sent" />
          <Figure value={heardBackPercent === null ? "None yet" : `${heardBackPercent}%`} label="heard back" />
          <Figure value={String(reachedInterview)} label="reached interview" />
        </dl>
      </div>
      <FunnelChart funnel={funnel} />
    </section>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-0.5">
      <dt className="text-label text-muted">{label}</dt>
      <dd className="text-title leading-none font-bold tabular-nums">{value}</dd>
    </div>
  );
}

/** Compact, readable status summary for sparse and established searches alike. */
function ApplicationOverview({ byStatus, count }: { byStatus: Record<ApplicationStatus, number>; count: number }) {
  const present = STATUSES.filter(({ value }) => byStatus[value] > 0);
  return (
    <section aria-labelledby="overview-heading" className={`${card} gap-[18px] px-7 py-[26px]`}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="overview-heading" className="text-subsection">Your applications</h2>
          <p className="text-meta text-muted">{plural(count, "application", "applications")} in this period</p>
        </div>
        <Link href="/applications?view=board" className="text-meta text-muted underline underline-offset-3 hover:text-ink">
          Open board
        </Link>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-x-5 gap-y-1">
        {present.map(({ value, label }) => (
          <li key={value} className="flex items-center gap-[9px] py-1.5 text-sm text-ink">
            <StatusDot status={value} />
            <span className="flex-1">{label}</span>
            <span className="tabular-nums">{byStatus[value]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Before the first application: where to begin. */
function Welcome() {
  return (
    <Panel>
      <h2 className="text-section text-primary-text">Welcome to Hiretivo</h2>
      <p className="text-sm text-muted">
        Start with your profile: your roles, skills and education are what every tailored resume and cover letter is built from.
        Then paste a job posting. Your applications will show up here as you make progress.
      </p>
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Link href="/resume?tab=profile" className={buttonClassName("secondary")}>
          Fill in your profile
        </Link>
        <Link href="/new?fresh=1" className={buttonClassName("primary", "md", "hover:text-on-primary")}>
          + New application
        </Link>
        <Link href="/welcome" className="text-sm text-muted underline underline-offset-2 hover:text-ink">
          Open the setup guide
        </Link>
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className={`${card} max-w-[640px] items-start gap-3 p-7`}>{children}</div>;
}
