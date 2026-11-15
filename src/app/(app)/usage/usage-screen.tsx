import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/cn";
import { DASHBOARD_PERIODS, type DashboardPeriod } from "@/lib/dashboard";
import { formatDay } from "@/lib/dates";
import type { TokenSum, UsageFigures, UsageTotals } from "@/lib/usage";

import { PeriodFilter, PeriodScoped } from "../period-filter";

const number = (value: number) => value.toLocaleString("en-US");
const head = "py-3 pr-5 text-caption font-semibold text-muted";

/** The Usage screen (#290): the tokens each kind of AI request used, as the servers counted them. */
export function UsageScreen({
  figures,
  period,
  countingSince,
  timeZone,
  history = [],
}: {
  figures: UsageFigures;
  period: DashboardPeriod;
  /** The first request counted, ever; null before there was one. */
  countingSince: Date | null;
  timeZone?: string;
  history?: { id: string; task: string; fromProvider: string; fromModel: string; toProvider: string; toModel: string; reason: string; createdAt: Date }[];
}) {
  const within = DASHBOARD_PERIODS.find((entry) => entry.value === period)?.label.toLowerCase();
  const unreported = figures.total.input.unreported + figures.total.output.unreported > 0;
  return (
    <>
      <PageHeader
        title="Usage"
        description="The tokens each kind of AI request used, as your AI provider and Jev counted them. Input is what Hiretivo sent, output what came back, thinking included."
      />
      <PeriodFilter period={period} path="/usage" remember={false}>
        <PeriodScoped className="flex max-w-[960px] flex-col gap-3 px-10 pb-[72px]">
          <div className="relative overflow-x-auto rounded-panel border border-line-card bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">Tokens by task, {within}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className={cn(head, "pl-5")}>
                    Task
                  </th>
                  {["Requests", "Input", "Output", "Total"].map((label) => (
                    <th key={label} scope="col" className={cn(head, "w-[124px] text-right")}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {figures.rows.map((row) => (
                  <tr key={row.task} className="border-b border-line">
                    <th scope="row" className="py-3 pr-5 pl-5 text-left align-top font-normal">
                      <span className="block text-control font-semibold">{row.label}</span>
                      <span className="block text-meta text-muted">{row.hint}</span>
                    </th>
                    <Figures totals={row} />
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="py-3 pr-5 pl-5 text-left align-top text-control font-semibold">
                    All tasks
                  </th>
                  <Figures totals={figures.total} strong />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-meta text-muted">
            {countingSince ? `Counting since ${formatDay(countingSince, timeZone)}.` : "Nothing counted yet. Every AI request counts from now on."}
            {unreported && " “Not reported” means the server didn't say how many tokens a request used."}
          </p>
          <section className="mt-6">
            <h2 className="text-section text-primary-text">Automatic model switches</h2>
            {history.length === 0 ? <p className="mt-2 text-sm text-muted">No automatic switches in this period.</p> : (
              <ul className="mt-3 flex flex-col gap-2">
                {history.map((event) => <li key={event.id} className="rounded-card border border-line-card bg-card px-4 py-3 text-sm">
                  <span className="font-medium">{event.task}</span>: {event.fromProvider} <span className="font-mono text-[13px]">{event.fromModel}</span> → {event.toProvider} <span className="font-mono text-[13px]">{event.toModel}</span>
                  <span className="block text-meta text-muted">{event.reason.replaceAll("-", " ")} · {formatDay(event.createdAt, timeZone)}</span>
                </li>)}
              </ul>
            )}
          </section>
        </PeriodScoped>
      </PeriodFilter>
    </>
  );
}

/** Requests, input, output and total, for a task or all of them. */
function Figures({ totals, strong }: { totals: UsageTotals; strong?: boolean }) {
  const cell = cn("py-3 pr-5 text-right align-top text-control tabular-nums", totals.requests === 0 && "text-muted", strong && "font-semibold");
  return (
    <>
      <td className={cell}>{number(totals.requests)}</td>
      <td className={cell}>
        <Tokens sum={totals.input} />
      </td>
      <td className={cell}>
        <Tokens sum={totals.output} />
      </td>
      <td className={cell}>{totals.total === null ? <NotReported /> : number(totals.total)}</td>
    </>
  );
}

function Tokens({ sum }: { sum: TokenSum }) {
  if (sum.tokens === null) return <NotReported />;
  return (
    <>
      {number(sum.tokens)}
      {sum.unreported > 0 && (
        <span className="block text-meta font-normal text-muted">
          {number(sum.unreported)} {sum.unreported === 1 ? "request" : "requests"} not reported
        </span>
      )}
    </>
  );
}

function NotReported() {
  return <span className="font-normal text-muted">Not reported</span>;
}
