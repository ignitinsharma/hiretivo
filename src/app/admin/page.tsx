import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin/is-admin";
import { getAdminDashboardStats, getAdminJobsStats } from "@/services/admin-stats.service";
import { TrendChart } from "@/modules/admin/components/TrendChart";
import { SeekersTable } from "@/modules/admin/components/SeekersTable";
import { JobsTable } from "@/modules/admin/components/JobsTable";
import type { AdminDashboardStats } from "@/services/admin-stats.service";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-foreground-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-brand-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-brand-foreground-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface p-5">
      <h2 className="text-sm font-semibold text-brand-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}

function PlanSplit({ stats }: { stats: AdminDashboardStats }) {
  const total = stats.planSplit.reduce((sum, p) => sum + p.count, 0) || 1;
  return (
    <div className="space-y-3">
      {stats.planSplit.map((p) => (
        <div key={p.plan}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-brand-foreground">{p.plan}</span>
            <span className="text-brand-foreground-muted">
              {p.count} · {Math.round((p.count / total) * 100)}%
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-brand-primary/10">
            <div
              className="h-2 rounded-full bg-brand-primary"
              style={{ width: `${(p.count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-brand-foreground-muted">
        Active subscriptions: {stats.activeSubscriptions} · Canceled:{" "}
        {stats.canceledSubscriptions}
      </p>
    </div>
  );
}

function Funnel({ stats }: { stats: AdminDashboardStats }) {
  const { total, onboarded, verified } = stats.funnel;
  const steps = [
    { label: "Registered", value: total },
    { label: "Onboarded", value: onboarded },
    { label: "Verified", value: verified },
  ];
  return (
    <div className="flex items-end justify-between gap-4">
      {steps.map((s, i) => (
        <div key={s.label} className="flex-1">
          <p className="text-xs text-brand-foreground-muted">{s.label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-foreground">{s.value}</p>
          <div
            className="mt-2 rounded-t-lg bg-brand-primary/20"
            style={{ height: `${Math.max((s.value / (total || 1)) * 120, 4)}px` }}
          />
          {i < steps.length - 1 ? (
            <p className="mt-1 text-[10px] text-brand-foreground-muted">
              {total ? `${Math.round((steps[i + 1].value / s.value) * 100)}%` : "—"}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function JobSourceSplit({ perSource, totalActive }: { perSource: { source: string; count: number }[]; totalActive: number }) {
  const total = totalActive || 1;
  return (
    <div className="space-y-3">
      {perSource.length === 0 ? (
        <p className="text-sm text-brand-foreground-muted">No active jobs yet.</p>
      ) : (
        perSource.map((p) => (
          <div key={p.source}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize text-brand-foreground">{p.source}</span>
              <span className="text-brand-foreground-muted">
                {p.count} · {Math.round((p.count / total) * 100)}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-brand-primary/10">
              <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${(p.count / total) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; jobPage?: string; jq?: string; jsrc?: string }>;
}) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-brand-foreground-muted">Access denied.</p>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const jobPage = Math.max(1, parseInt(params.jobPage ?? "1", 10) || 1);
  const [stats, jobsStats] = await Promise.all([
    getAdminDashboardStats(page, 50, params.q),
    getAdminJobsStats({ page: jobPage, pageSize: 25, q: params.jq, source: params.jsrc }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <h1 className="text-xl font-bold text-brand-foreground">Admin · Seeker Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="New seekers (7d)" value={stats.newSeekers7d} />
        <StatCard label="Total seekers" value={stats.totalSeekers} />
        <StatCard
          label="Active seekers (30d)"
          value={stats.activeSeekers30d}
          hint="Logged in or active in the last 30 days"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Signups · last 14 days">
          <TrendChart data={stats.signupTrend} />
        </SectionCard>
        <SectionCard title="Resume & cover-letter generations · last 14 days">
          <TrendChart data={stats.generationTrend} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Plan distribution">
          <PlanSplit stats={stats} />
        </SectionCard>
        <SectionCard title="Conversion funnel">
          <Funnel stats={stats} />
        </SectionCard>
      </div>

      <SectionCard title="Seekers">
        <SeekersTable
          seekers={stats.seekers}
          total={stats.totalSeekersForTable}
          page={stats.page}
          pageSize={stats.pageSize}
          query={params.q ?? ""}
        />
      </SectionCard>

      <hr className="border-t border-brand-border" />

      <SectionCard title="Active Jobs · Overview">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active jobs" value={jobsStats.totalActive} hint="OPEN · visible in Browse" />
          <StatCard label="Closed jobs" value={jobsStats.totalClosed} />
          <StatCard label="Manual tracked" value={jobsStats.totalManual} hint="DRAFT · private tracker only" />
          <StatCard label="New jobs (7d)" value={jobsStats.newJobs7d} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-brand-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-brand-foreground">Per-source (active)</h3>
            <JobSourceSplit perSource={jobsStats.perSource} totalActive={jobsStats.totalActive} />
          </div>
          <div className="rounded-xl border border-brand-border bg-white p-4 flex items-center justify-center">
            <p className="text-sm text-brand-foreground-muted">
              {jobsStats.totalActive} active · {jobsStats.totalClosed} closed · {jobsStats.newJobs7d} new this week
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Active Jobs · Listing">
        <JobsTable
          jobs={jobsStats.jobs}
          total={jobsStats.totalForTable}
          page={jobsStats.page}
          pageSize={jobsStats.pageSize}
          query={params.jq ?? ""}
          source={params.jsrc ?? "All"}
        />
      </SectionCard>
    </div>
  );
}