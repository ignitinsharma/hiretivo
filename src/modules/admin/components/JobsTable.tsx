"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminJobRow } from "@/services/admin-stats.service";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SOURCE_COLOR: Record<string, string> = {
  ashby: "bg-violet-100 text-violet-700",
  greenhouse: "bg-emerald-100 text-emerald-700",
  lever: "bg-blue-100 text-blue-700",
  Manual: "bg-gray-100 text-gray-600",
};

export function JobsTable({
  jobs,
  total,
  page,
  pageSize,
  query,
  source,
}: {
  jobs: AdminJobRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  source: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [sourceFilter, setSourceFilter] = useState(source || "All");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const go = (nextPage: number, q: string, src: string) => {
    const params = new URLSearchParams(window.location.search);
    if (nextPage > 1) params.set("jobPage", String(nextPage));
    else params.delete("jobPage");
    if (q.trim()) params.set("jq", q.trim());
    else params.delete("jq");
    if (src && src !== "All") params.set("jsrc", src);
    else params.delete("jsrc");
    const qs = params.toString();
    router.replace(`/admin${qs ? `?${qs}` : ""}`);
  };

  const handleSearch = () => go(1, search, sourceFilter);
  const handleSourceChange = (v: string) => {
    setSourceFilter(v);
    go(1, search, v);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search title or company…"
            className="w-56 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-primary"
          />
          <button onClick={handleSearch} className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary-dk">Search</button>
          <select
            value={sourceFilter}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-foreground"
          >
            <option value="All">All sources</option>
            <option value="ashby">Ashby</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
        <span className="text-xs text-brand-foreground-muted">
          {total} job{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-foreground-muted">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Company</th>
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 pr-4 font-medium">Location</th>
              <th className="py-2 pr-4 font-medium">Posted</th>
              <th className="py-2 pr-4 font-medium">Applicants</th>
              <th className="py-2 pr-4 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-brand-foreground-muted">No active jobs found.</td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id} className="border-b border-brand-border/60 hover:bg-brand-primary/[0.03]">
                <td className="py-2 pr-4 font-medium text-brand-foreground max-w-[260px] truncate" title={j.title}>{j.title}</td>
                <td className="py-2 pr-4 text-brand-foreground-muted">{j.companyName ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${SOURCE_COLOR[j.atsSource ?? "Manual"] ?? "bg-gray-100 text-gray-600"}`}>
                    {j.atsSource ?? "Manual"}
                  </span>
                </td>
                <td className="py-2 pr-4 text-brand-foreground-muted">{j.location ?? j.locationClass ?? "Manual"}</td>
                <td className="py-2 pr-4 text-brand-foreground-muted">{fmtDate(j.publishedAt ?? j.lastSeenAt)}</td>
                <td className="py-2 pr-4 text-brand-foreground-muted">{j.applicantCount}</td>
                <td className="py-2 pr-4 text-brand-foreground-muted">{fmtDate(j.lastSeenAt ?? j.publishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => go(page - 1, query, source)} disabled={page <= 1} className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-foreground disabled:opacity-40">Previous</button>
          <button onClick={() => go(page + 1, query, source)} disabled={page >= totalPages} className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-foreground disabled:opacity-40">Next</button>
        </div>
      ) : null}
    </div>
  );
}
