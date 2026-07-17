"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, ExternalLink, FileText, Loader2, MoreHorizontal, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";

import { applicationService } from "@/services/application.service";
import { AutomationStatus } from "@/constants/enums";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

type TrackerTab = "all" | "submitted" | "in_flight" | "needs_you" | "failed" | "skipped";

interface TabDef {
  key: TrackerTab;
  label: string;
}

const TABS: TabDef[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "in_flight", label: "In Flight" },
  { key: "needs_you", label: "Needs You" },
  { key: "failed", label: "Failed" },
  { key: "skipped", label: "Skipped" },
];

function getAutomationStatus(app: SeekerApplicationItem): AutomationStatus | undefined {
  return (app as unknown as Record<string, unknown>).automationStatus as AutomationStatus | undefined;
}

function filterByTab(apps: SeekerApplicationItem[], tab: TrackerTab): SeekerApplicationItem[] {
  switch (tab) {
    case "all":
      return apps;
    case "submitted":
      return apps.filter((a) => getAutomationStatus(a) === AutomationStatus.SUBMITTED);
    case "in_flight":
      return apps.filter((a) => {
        const s = getAutomationStatus(a);
        return s === AutomationStatus.GENERATING || s === AutomationStatus.READY || s === AutomationStatus.APPLYING;
      });
    case "needs_you":
      return apps.filter((a) => getAutomationStatus(a) === AutomationStatus.NEEDS_YOU);
    case "failed":
      return apps.filter((a) => getAutomationStatus(a) === AutomationStatus.FAILED);
    case "skipped":
      return apps.filter((a) => getAutomationStatus(a) === AutomationStatus.SKIPPED);
  }
}

function ResumeStatusBadge({ automationStatus }: { automationStatus?: AutomationStatus | null }) {
  if (!automationStatus) return <span className="text-xs text-brand-foreground-secondary">Not generated</span>;

  const isReady = automationStatus === AutomationStatus.READY
    || automationStatus === AutomationStatus.GENERATING
    || automationStatus === AutomationStatus.APPLYING
    || automationStatus === AutomationStatus.SUBMITTED;

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
      isReady ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-100"
    }`}>
      {isReady ? "Ready" : "Not generated"}
    </span>
  );
}

function AutomationStatusBadge({ status, failureReason }: { status?: AutomationStatus | null; failureReason?: string | null }) {
  if (!status) return <span className="text-xs text-brand-foreground-secondary">—</span>;

  const styles: Record<string, string> = {
    [AutomationStatus.GENERATING]: "text-blue-600 bg-blue-50",
    [AutomationStatus.READY]: "text-green-600 bg-green-50",
    [AutomationStatus.APPLYING]: "text-purple-600 bg-purple-50",
    [AutomationStatus.SUBMITTED]: "text-emerald-600 bg-emerald-50",
    [AutomationStatus.NEEDS_YOU]: "text-amber-600 bg-amber-50",
    [AutomationStatus.FAILED]: "text-red-600 bg-red-50",
    [AutomationStatus.COMPLETED]: "text-green-600 bg-green-50",
    [AutomationStatus.SKIPPED]: "text-gray-600 bg-gray-100",
  };

  const labels: Record<string, string> = {
    [AutomationStatus.GENERATING]: "Generating",
    [AutomationStatus.READY]: "Ready",
    [AutomationStatus.APPLYING]: "Applying",
    [AutomationStatus.SUBMITTED]: "Submitted",
    [AutomationStatus.NEEDS_YOU]: "Needs you",
    [AutomationStatus.FAILED]: "Failed",
    [AutomationStatus.COMPLETED]: "Completed",
    [AutomationStatus.SKIPPED]: "Skipped",
  };

  const badge = (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[status] ?? "text-gray-600 bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );

  if (status === AutomationStatus.FAILED && failureReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 text-xs">
            {failureReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

function HiringStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPLIED: "text-blue-600 bg-blue-50",
    REVIEWING: "text-purple-600 bg-purple-50",
    INTERVIEW: "text-emerald-600 bg-emerald-50",
    OFFER: "text-amber-600 bg-amber-50",
    HIRED: "text-green-600 bg-green-50",
    REJECTED: "text-red-600 bg-red-50",
  };

  const labels: Record<string, string> = {
    APPLIED: "Applied",
    REVIEWING: "Reviewing",
    INTERVIEW: "Interview",
    OFFER: "Offer",
    HIRED: "Hired",
    REJECTED: "Rejected",
  };

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[status] ?? "text-gray-600 bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function TrackerPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TrackerTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = (appId: string) => {
    setRetryingId(appId);
    fetch(`/api/applications/${appId}/generate`, { method: "POST" })
      .catch(() => {})
      .finally(() => {
        setRetryingId(null);
        queryClient.invalidateQueries({ queryKey: ["applications"] });
      });
  };

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const tabbed = filterByTab(applications, activeTab);
    if (!searchQuery.trim()) return tabbed;
    const q = searchQuery.toLowerCase();
    return tabbed.filter(
      (a) =>
        a.companyName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q),
    );
  }, [applications, activeTab, searchQuery]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-foreground">Tracker</h1>
        <p className="text-sm text-brand-foreground-muted mt-1">
          Track your job applications from applied to offer.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-brand-primary text-white"
                  : "text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-brand-surface rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-brand-foreground-muted" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-brand-foreground placeholder:text-brand-foreground-secondary w-32"
          />
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface">
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Resume Status</th>
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Automation</th>
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Hiring Status</th>
                <th className="text-left text-xs font-medium text-brand-foreground-muted px-5 py-3">Applied Date</th>
                <th className="w-12 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-brand-foreground-muted">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-brand-foreground-muted">
                    No applications found. Start applying to jobs to see them here.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-brand-border hover:bg-brand-surface/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/applications/${app.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center text-xs font-bold text-brand-foreground-muted shrink-0">
                          {app.companyName[0]}
                        </div>
                        <span className="text-sm font-semibold text-brand-foreground">{app.companyName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-brand-foreground">{app.jobTitle}</td>
                    <td className="px-5 py-3.5">
                      <ResumeStatusBadge automationStatus={getAutomationStatus(app)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <AutomationStatusBadge status={getAutomationStatus(app)} failureReason={app.failureReason} />
                    </td>
                    <td className="px-5 py-3.5">
                      <HiringStatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-brand-foreground-muted">{app.appliedAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {getAutomationStatus(app) === AutomationStatus.FAILED && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRetry(app.id); }}
                            disabled={retryingId === app.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-foreground-muted hover:text-brand-primary hover:bg-brand-surface transition-colors"
                            aria-label="Retry generation"
                          >
                            {retryingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-foreground-muted hover:text-brand-foreground hover:bg-brand-surface transition-colors"
                          aria-label="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
