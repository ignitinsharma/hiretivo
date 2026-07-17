"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  useDndContext,
  pointerWithin,
  getFirstCollision,
} from "@dnd-kit/core";
import { Search } from "lucide-react";

import { applicationService } from "@/services/application.service";
import { PipelineStage } from "@/constants/enums";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, KanbanCardOverlay } from "./KanbanCard";
import { BoardSkeleton } from "./BoardSkeleton";
import { BoardError } from "./BoardError";
import { useKanbanDrag } from "../hooks/useKanbanDrag";

import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

const COLUMN_DEFS = [
  { id: PipelineStage.NOT_APPLIED, label: "Not Applied Yet", color: "bg-gray-400" },
  { id: PipelineStage.APPLIED, label: "Applied", color: "bg-blue-500" },
  { id: PipelineStage.INTERVIEWING, label: "Interviewing", color: "bg-cyan-500" },
  { id: PipelineStage.OFFER, label: "Offer", color: "bg-amber-500" },
  { id: PipelineStage.REJECTED, label: "Rejected", color: "bg-red-500" },
];

function ActiveDragOverlay({ applications }: { applications: SeekerApplicationItem[] }) {
  const { active } = useDndContext();
  const activeApp = active
    ? applications.find((a) => a.id === active.id)
    : undefined;
  if (!activeApp) return null;
  return (
    <DragOverlay dropAnimation={null}>
      <KanbanCardOverlay app={activeApp} />
    </DragOverlay>
  );
}

function useScrollPreservation(boardRef: React.RefObject<HTMLDivElement | null>) {
  const scrollLeftRef = useRef<number>(0);
  const shouldRestore = useRef(false);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const handleScroll = () => {
      scrollLeftRef.current = el.scrollLeft;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [boardRef]);

  const snapshotScroll = useCallback(() => {
    shouldRestore.current = true;
  }, []);

  const restoreIfNeeded = useCallback(() => {
    if (!shouldRestore.current) return;
    const el = boardRef.current;
    if (el) {
      el.scrollLeft = scrollLeftRef.current;
    }
    shouldRestore.current = false;
  }, [boardRef]);

  return { snapshotScroll, restoreIfNeeded };
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { snapshotScroll, restoreIfNeeded } = useScrollPreservation(boardRef);

  const handleRetry = useCallback(
    (appId: string) => {
      setRetryingId(appId);
      fetch(`/api/applications/${appId}/generate`, { method: "POST" })
        .catch(() => {})
        .finally(() => {
          setRetryingId(null);
          queryClient.invalidateQueries({ queryKey: ["applications"] });
        });
    },
    [queryClient],
  );

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(
      (a) =>
        a.companyName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q),
    );
  }, [applications, searchQuery]);

  const groupedByStage = useMemo(() => {
    const map: Record<string, SeekerApplicationItem[]> = {};
    for (const col of COLUMN_DEFS) {
      map[col.id] = [];
    }
    for (const app of filtered) {
      const stage = app.pipelineStage ?? PipelineStage.NOT_APPLIED;
      if (map[stage]) {
        map[stage].push(app);
      }
    }
    return map;
  }, [filtered]);

  const { sensors, handleDragEnd } = useKanbanDrag(filtered);

  const onDragStart = useCallback(() => {
    snapshotScroll();
  }, [snapshotScroll]);

  const onDragEnd = useCallback(
    (event: Parameters<typeof handleDragEnd>[0]) => {
      handleDragEnd(event);
      restoreIfNeeded();
    },
    [handleDragEnd, restoreIfNeeded],
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-foreground">Tracker</h1>
          <p className="text-sm text-brand-foreground-muted mt-1">
            Track your job applications from applied to offer.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-surface rounded-lg px-3 py-1.5 w-fit">
          <Search className="w-3.5 h-3.5 text-brand-foreground-muted" />
          <input
            type="text"
            placeholder="Search applications..."
            disabled
            className="bg-transparent border-none outline-none text-xs text-brand-foreground placeholder:text-brand-foreground-secondary w-48"
          />
        </div>
        <BoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-foreground">Tracker</h1>
          <p className="text-sm text-brand-foreground-muted mt-1">
            Track your job applications from applied to offer.
          </p>
        </div>
        <BoardError />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-foreground">Tracker</h1>
        <p className="text-sm text-brand-foreground-muted mt-1">
          Track your job applications from applied to offer.
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-brand-surface rounded-lg px-3 py-1.5 w-fit">
        <Search className="w-3.5 h-3.5 text-brand-foreground-muted" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-brand-foreground placeholder:text-brand-foreground-secondary w-48"
        />
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        autoScroll={false}
        collisionDetection={pointerWithin}
      >
        <div
          ref={boardRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
        >
          {COLUMN_DEFS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              applications={groupedByStage[col.id] ?? []}
              onRetry={handleRetry}
              retryingId={retryingId}
            />
          ))}
        </div>
        <ActiveDragOverlay applications={filtered} />
      </DndContext>
    </div>
  );
}
