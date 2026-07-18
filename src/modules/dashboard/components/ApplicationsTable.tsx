"use client";

import React from "react";
import { Search, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { applicationService } from "@/services/application.service";
import { ApplicationStatus, AutomationStatus } from "@/constants/enums";
import { Button } from "@/components/ui/button";
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

function getDynamicStatus(app: SeekerApplicationItem): { label: string; className: string } {
  if (app.automationStatus === AutomationStatus.SUBMITTED) {
    return { label: "Applied", className: "text-green-600 bg-green-50" };
  }
  if (app.automationStatus === AutomationStatus.READY) {
    return { label: "Resume Generated", className: "text-amber-600 bg-amber-50" };
  }
  return { label: "Not Ready", className: "text-gray-600 bg-gray-100" };
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

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  const filtered = activeTab === "All"
    ? applications
    : applications.filter((a) => a.status === activeTab);

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
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-pill px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search company..."
              className="bg-transparent border-none outline-none text-xs text-gray-600 placeholder:text-gray-400 w-28"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-brand-border">
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Company</th>
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Applied</th>
              <th className="w-12 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                  No applications yet. Start applying to jobs to see them here.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const dynamicStatus = getDynamicStatus(app);
                return (
                  <tr
                    key={app.id}
                    className="border-t border-brand-border hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/applications/${app.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-pill bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                          {app.companyName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{app.companyName}</p>
                          <p className="text-xs text-gray-500">{app.jobTitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${dynamicStatus.className}`}>
                        {dynamicStatus.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {getAppliedColumn(app)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          aria-label="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/applications/${app.id}`);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="w-7 h-7 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
    </div>
  );
}
