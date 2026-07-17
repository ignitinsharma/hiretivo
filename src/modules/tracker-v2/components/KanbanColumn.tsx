"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

interface ColumnDef {
  id: string;
  label: string;
  color: string;
}

interface KanbanColumnProps {
  column: ColumnDef;
  applications: SeekerApplicationItem[];
  onRetry: (id: string) => void;
  retryingId: string | null;
}

export function KanbanColumn({
  column,
  applications,
  onRetry,
  retryingId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const cardIds = applications.map((app) => app.id);

  return (
    <div className="shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] flex flex-col max-h-[calc(100vh-260px)] snap-start">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-6 rounded-pill ${column.color}`} />
        <h3 className="text-sm font-bold text-brand-foreground">{column.label}</h3>
        <span className="text-xs font-medium text-brand-foreground-secondary bg-brand-surface rounded-pill px-2 py-0.5">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 rounded-lg transition-colors p-1 -m-1 ${
          isOver ? "bg-brand-primary/5 ring-2 ring-brand-primary/20 rounded-lg" : ""
        }`}
      >
        {applications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-brand-foreground-secondary">
              No applications here
            </p>
          </div>
        ) : (
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2 overflow-y-auto min-h-0 pr-1">
              {applications.map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  onRetry={onRetry}
                  retryingId={retryingId}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
