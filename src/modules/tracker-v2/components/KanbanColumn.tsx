"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { LucideIcon } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

interface ColumnDef {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
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
  const Icon = column.icon;

  return (
    <div className="shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] flex flex-col max-h-[calc(100vh-300px)] snap-start rounded-xl border border-brand-border bg-white">
      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2">
          <Icon
            className="h-4 w-4 shrink-0"
            style={{ color: column.color }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-bold text-brand-foreground">
            {column.label}
          </h3>
          <span className="text-xs font-medium text-brand-foreground-secondary">
            {applications.length}
          </span>
        </div>
        <div
          className="mt-2.5 h-0.5 w-full rounded-pill"
          style={{ backgroundColor: column.color }}
          aria-hidden="true"
        />
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col gap-2 rounded-b-xl px-3 pb-3 transition-colors ${
          isOver ? "bg-brand-primary/5 ring-2 ring-inset ring-brand-primary/20" : ""
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
            <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
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
