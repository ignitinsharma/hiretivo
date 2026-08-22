"use client";

import React from "react";
import { Search, Eye, MoreHorizontal, Briefcase, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { applicationService } from "@/services/application.service";
import { ApplicationStatus, AutomationStatus } from "@/constants/enums";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

type Tab = "All" | ApplicationStatus;

const STATUS_TABS: Tab[] = ["All", ApplicationStatus.APPLIED, ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.HIRED, ApplicationStatus.REJECTED];

const STATUS_LABELS: Record<string, string> = {
  [ApplicationStatus.APPLIED]: "Applied",
  [ApplicationStatus.REVIEWING]: "Reviewing",
  [ApplicationStatus.INTERVIEW]: "Interview",
  [ApplicationStatus.OFFER]: "Offer",
  [ApplicationStatus.HIRED]: "Hired",
  [ApplicationStatus.REJECTED]: "Rejected",
};

function getDynamicStatus(app: SeekerApplicationItem): { label: string; className: string; isGenerating?: boolean } {
  if (app.automationStatus === AutomationStatus.GENERATING) {
    return { label: "Generating", className: "text-amber-700 bg-amber-50 border border-amber-200", isGenerating: true };
  }
  if (app.automationStatus === AutomationStatus.READY) {
    return { label: "Generated", className: "text-emerald-700 bg-emerald-50 border border-emerald-200" };
  }
  if (app.automationStatus === AutomationStatus.FAILED) {
    return { label: "Resume Failed", className: "text-red-700 bg-red-50 border border-red-200" };
  }
  if (app.automationStatus === AutomationStatus.SUBMITTED) {
    return { label: "Applied", className: "text-brand-success bg-brand-success/10" };
  }
  return { label: "Not Ready", className: "text-brand-foreground-secondary bg-brand-foreground-secondary/10" };
}

function getAppliedColumn(app: SeekerApplicationItem): string {
  if (app.automationStatus === AutomationStatus.SUBMITTED && app.appliedAt) {
    return formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true });
  }
  return "\u2014";
}

export function ApplicationsTable() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<Tab>("All");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data as SeekerApplicationItem[] | undefined;
      const hasGenerating = data?.some((a) => a.automationStatus === AutomationStatus.GENERATING);
      return hasGenerating ? 3000 : false;
    },
  });

  const filtered = React.useMemo(() => {
    let list = activeTab === "All" ? applications : applications.filter((a) => a.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.companyName.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q));
    }
    return list;
  }, [applications, activeTab, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const paginated = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Edge: reset page when filters/search/rowsPerPage change or when total shrinks (e.g., after dismiss)
  React.useEffect(() => { setPage(1); }, [search, activeTab, rowsPerPage]);
  React.useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const showingFrom = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const showingTo = Math.min(page * rowsPerPage, total);

  return (
    <div className="bg-white rounded-card border border-brand-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-3 py-1.5 rounded-pill transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-brand-primary text-white"
                    : "text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-surface"
              }`}
            >
              {tab === "All" ? "All" : STATUS_LABELS[tab] ?? tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/tracker">
              Open tracker
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 border border-brand-border bg-white rounded-pill px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-brand-foreground-secondary" />
            <input
              type="text"
              placeholder="Search company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-brand-foreground placeholder:text-brand-foreground-muted w-32"
            />
          </div>
        </div>
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 rounded-xl border border-brand-border bg-brand-surface flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-brand-foreground-secondary" />
          </div>
          <div className="text-center">
            <p className="text-brand-foreground font-semibold text-base">No applications yet</p>
            <p className="text-brand-foreground-muted text-sm mt-1">
              {applications.length > 0
                ? "No applications match this search or status."
                : "Start applying to jobs to track your progress here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-brand-border">
                <th className="text-left text-xs font-medium text-brand-foreground-secondary px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-brand-foreground-secondary px-5 py-3">Resume</th>
                <th className="text-left text-xs font-medium text-brand-foreground-secondary px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-brand-foreground-secondary px-5 py-3">Applied</th>
                <th className="w-12 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody aria-busy={isLoading}>
              {isLoading ? (
                Array.from({ length: rowsPerPage === 10 ? 5 : Math.min(rowsPerPage, 5) }).map((_, i) => (
                  <tr key={i} className="border-t border-brand-border">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-6 w-20 rounded-pill" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-6 w-20 rounded-pill" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-7 w-7 rounded-pill" />
                        <Skeleton className="h-7 w-7 rounded-pill" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                paginated.map((app) => {
                  const dynamicStatus = getDynamicStatus(app);
                  const isGenerating = app.automationStatus === AutomationStatus.GENERATING;
                  return (
                    <tr
                      key={app.id}
                      className="border-t border-brand-border hover:bg-brand-surface transition-colors cursor-pointer"
                      onClick={() => router.push(`/applications/${app.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
                            <span className="text-xs font-bold text-brand-foreground-muted">
                              {app.companyName[0]}
                            </span>
                            {app.companyLogoUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={app.companyLogoUrl}
                                alt={`${app.companyName} logo`}
                                className="absolute inset-0 h-full w-full bg-white object-contain"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-foreground">{app.companyName}</p>
                            <p className="text-xs text-brand-foreground-muted">{app.jobTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isGenerating ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-pill border border-amber-200 bg-amber-50 text-amber-700">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating
                          </span>
                        ) : app.automationStatus === AutomationStatus.READY ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
                            Generated
                          </span>
                        ) : app.automationStatus === AutomationStatus.FAILED ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-pill border border-red-200 bg-red-50 text-red-700" title={app.failureReason ?? undefined}>
                            Failed
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${dynamicStatus.className}`}>
                            {dynamicStatus.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${dynamicStatus.className}`}>
                          {dynamicStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-foreground-muted">
                        {getAppliedColumn(app)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            className="w-7 h-7 rounded-pill flex items-center justify-center text-brand-foreground-secondary hover:text-brand-primary hover:bg-brand-surface"
                            aria-label="View details"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/applications/${app.id}`);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="w-7 h-7 rounded-pill flex items-center justify-center text-brand-foreground-secondary hover:text-brand-primary hover:bg-brand-surface"
                            aria-label="More options"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — Rows per page 10/25/50 + 1 2 3 4 Next, handles lots */}
      {total > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border bg-white flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-brand-foreground-muted">
            <span>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-brand-border rounded-lg bg-white px-2 py-1 text-xs text-brand-foreground"
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>Showing {showingFrom}–{showingTo} of {total}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-brand-border bg-white disabled:opacity-40 hover:bg-brand-surface"
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-brand-border bg-white disabled:opacity-40 hover:bg-brand-surface"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(4, totalPages) }).map((_, i) => {
              const n = i + 1;
              // Simple: show 1..4, and if totalPages>4, 4th is last page when page>4? For minimal keep 1-4 only. User asked simple 1 2 3 4 Next.
              const pageNum = n;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-7 min-w-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold border ${page === pageNum ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" : "bg-white border-brand-border hover:bg-brand-surface"}`}
                  aria-current={page === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-7 px-2.5 flex items-center justify-center rounded-lg border border-brand-border bg-white disabled:opacity-40 hover:bg-brand-surface text-xs font-medium"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-brand-border bg-white disabled:opacity-40 hover:bg-brand-surface"
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
