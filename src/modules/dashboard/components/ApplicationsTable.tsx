"use client";

import React from "react";
import { Search, ExternalLink, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { applicationService } from "@/services/application.service";
import { ApplicationStatus } from "@/constants/enums";
import { Button } from "@/components/ui/button";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

type Tab = "All" | ApplicationStatus;

const STATUS_TABS: Tab[] = ["All", ApplicationStatus.APPLIED, ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.HIRED, ApplicationStatus.REJECTED];

const STATUS_COLORS: Record<string, string> = {
  [ApplicationStatus.APPLIED]: "text-blue-600 bg-blue-50",
  [ApplicationStatus.REVIEWING]: "text-purple-600 bg-purple-50",
  [ApplicationStatus.INTERVIEW]: "text-emerald-600 bg-emerald-50",
  [ApplicationStatus.OFFER]: "text-amber-600 bg-amber-50",
  [ApplicationStatus.HIRED]: "text-green-600 bg-green-50",
  [ApplicationStatus.REJECTED]: "text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  [ApplicationStatus.APPLIED]: "Applied",
  [ApplicationStatus.REVIEWING]: "Reviewing",
  [ApplicationStatus.INTERVIEW]: "Interview",
  [ApplicationStatus.OFFER]: "Offer",
  [ApplicationStatus.HIRED]: "Hired",
  [ApplicationStatus.REJECTED]: "Rejected",
};

export function ApplicationsTable() {
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
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Resume</th>
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Applied</th>
              <th className="w-12 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                  No applications yet. Start applying to jobs to see them here.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-t border-brand-border hover:bg-gray-50/50 transition-colors">
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
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">Resume</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${STATUS_COLORS[app.status] ?? "text-gray-600 bg-gray-100"}`}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{app.appliedAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="View details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="More options">
                        <MoreHorizontal className="w-3.5 h-3.5" />
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
  );
}
