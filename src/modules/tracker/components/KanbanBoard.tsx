"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { applicationService } from "@/services/application.service";
import { ApplicationStatus } from "@/constants/enums";
import { KanbanColumn } from "./KanbanColumn";
import { EmptyAnalyticsState } from "./EmptyAnalyticsState";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

interface ColumnDef {
  title: string;
  statuses: ApplicationStatus[];
  color: string;
}

const COLUMNS: ColumnDef[] = [
  { title: "Applied", statuses: [ApplicationStatus.APPLIED], color: "bg-blue-500" },
  { title: "Interviewing", statuses: [ApplicationStatus.REVIEWING, ApplicationStatus.INTERVIEW], color: "bg-cyan-500" },
  { title: "Rejected", statuses: [ApplicationStatus.REJECTED], color: "bg-red-500" },
  { title: "Offer", statuses: [ApplicationStatus.OFFER, ApplicationStatus.HIRED], color: "bg-amber-500" },
];

const STATUS_FOR_COLUMN: Record<string, ApplicationStatus> = {
  Applied: ApplicationStatus.APPLIED,
  Interviewing: ApplicationStatus.REVIEWING,
  Rejected: ApplicationStatus.REJECTED,
  Offer: ApplicationStatus.OFFER,
};

function mapApplicationToCard(app: SeekerApplicationItem) {
  return {
    id: app.id,
    company: app.companyName,
    role: app.jobTitle,
    logo: app.companyName[0],
    date: app.appliedAt,
  };
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationService.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const previous = queryClient.getQueryData<SeekerApplicationItem[]>(["applications"]);
      queryClient.setQueryData<SeekerApplicationItem[]>(["applications"], (old) =>
        old?.map((app) => (app.id === id ? { ...app, status } : app)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["applications"], context.previous);
      }
      toast.error("Failed to update application status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = STATUS_FOR_COLUMN[destination.droppableId];
    if (!newStatus) return;

    const app = applications.find((a) => a.id === draggableId);
    if (!app) return;

    if (COLUMNS.find((c) => c.title === destination.droppableId)?.statuses.includes(app.status)) {
      return;
    }

    updateStatusMutation.mutate({ id: draggableId, status: newStatus });
  }

  if (isLoading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.title} className="shrink-0 w-[220px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-6 rounded-pill ${col.color}`} />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const hasData = applications.length > 0;

  if (!hasData) {
    return <EmptyAnalyticsState />;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnApps = applications.filter((app) =>
            col.statuses.includes(app.status),
          );
          return (
            <KanbanColumn
              key={col.title}
              title={col.title}
              count={columnApps.length}
              color={col.color}
              applications={columnApps.map(mapApplicationToCard)}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
