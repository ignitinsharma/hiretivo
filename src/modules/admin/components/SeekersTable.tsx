"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminSeekerRow } from "@/services/admin-stats.service";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SeekersTable({
  seekers,
  total,
  page,
  pageSize,
  query,
}: {
  seekers: AdminSeekerRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const go = (nextPage: number, q: string) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (q.trim()) params.set("q", q.trim());
    router.replace(`/admin${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go(1, search);
          }}
          placeholder="Search by name or email…"
          className="w-full max-w-xs rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-foreground outline-none focus:border-brand-primary"
        />
        <span className="text-xs text-brand-foreground-muted">
          {total} seeker{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-foreground-muted">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Plan</th>
              <th className="py-2 pr-4 font-medium">Signup</th>
              <th className="py-2 pr-4 font-medium">Last active</th>
              <th className="py-2 pr-4 font-medium">Seeking</th>
              <th className="py-2 pr-4 font-medium">Verification</th>
              <th className="py-2 font-medium">Apps</th>
            </tr>
          </thead>
          <tbody>
            {seekers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brand-foreground-muted">
                  No seekers found.
                </td>
              </tr>
            ) : (
              seekers.map((s) => (
                <tr key={s.id} className="border-b border-brand-border/60 hover:bg-brand-primary/[0.03]">
                  <td className="py-2 pr-4 font-medium text-brand-foreground">
                    {s.name ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-brand-foreground-muted">{s.email ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-brand-foreground-muted">{fmtDate(s.createdAt)}</td>
                  <td className="py-2 pr-4 text-brand-foreground-muted">{fmtDate(s.lastActiveAt)}</td>
                  <td className="py-2 pr-4 text-brand-foreground-muted">
                    {s.seekingStatus.replaceAll("_", " ")}
                  </td>
                  <td className="py-2 pr-4 text-brand-foreground-muted">
                    {s.verificationStatus.replaceAll("_", " ")}
                  </td>
                  <td className="py-2 text-brand-foreground-muted">{s.applicationCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => go(page - 1, query)}
            disabled={page <= 1}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => go(page + 1, query)}
            disabled={page >= totalPages}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}