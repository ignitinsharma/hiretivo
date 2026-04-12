"use client";

import React from "react";
import { Filter, Download } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ApplicationListSkeleton } from "./ApplicationListSkeleton";
import type { SeekerApplicationItem } from "../types/application.types";

async function fetchApplications(): Promise<SeekerApplicationItem[]> {
  const response = await fetch("/api/applications");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Failed to load applications",
    );
  }

  const data = (await response.json()) as Array<{
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    companyLogoUrl?: string | null;
    status: SeekerApplicationItem["status"];
    appliedAt: string;
  }>;

  return data.map((application) => ({
    ...application,
    companyLogoUrl: application.companyLogoUrl ?? undefined,
    appliedAt: new Date(application.appliedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
}

export function ApplicationList() {
  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  if (isLoading) {
    return <ApplicationListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-slate-900">
          Couldn&apos;t load your applications
        </h3>
        <p className="text-slate-500 mt-2">Please refresh and try again.</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          No applications yet
        </h3>
        <p className="text-slate-500 mt-2">
          You haven&apos;t applied to any jobs yet. Start exploring!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-extrabold tracking-tight">
            My Applications
          </h1>
          <p className="text-slate-500 text-base">
            You have submitted applications to {applications.length} companies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 rounded-lg font-semibold transition-all"
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 rounded-lg font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
}
