"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { applicationService } from "@/services/application.service";

import { ApplicationCard } from "./ApplicationCard";
import { ApplicationListSkeleton } from "./ApplicationListSkeleton";

export function ApplicationList() {
  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <ApplicationListSkeleton />;
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-brand-foreground">
          Couldn&apos;t load your applications
        </h3>
        <p className="mt-2 text-brand-foreground-muted">Please refresh and try again.</p>
      </Card>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-surface">
          <FileText className="h-7 w-7 text-brand-foreground-secondary" />
        </div>
        <h3 className="text-lg font-bold text-brand-foreground">No applications yet</h3>
        <p className="mt-2 text-brand-foreground-muted">
          You haven&apos;t applied to any jobs yet. Start exploring!
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
          My Applications
        </h1>
        <p className="text-base text-brand-foreground-muted">
          You have submitted applications to {applications.length} companies.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
}
