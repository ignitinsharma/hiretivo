"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  useDndContext,
  pointerWithin,
} from "@dnd-kit/core";
import { Search, LineChart, TrendingUp, Clock, Send, Users, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import { applicationService } from "@/services/application.service";
import { PipelineStage } from "@/constants/enums";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, KanbanCardOverlay } from "./KanbanCard";
import { ManualJobDialog } from "./ManualJobDialog";
import { BoardSkeleton } from "./BoardSkeleton";
import { BoardError } from "./BoardError";
import { useKanbanDrag } from "../hooks/useKanbanDrag";

import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

const COLUMN_DEFS = [
  { id: PipelineStage.NOT_APPLIED, label: "Not Applied Yet", color: "#9ca3af", icon: Clock },
  { id: PipelineStage.APPLIED, label: "Applied", color: "#3b82f6", icon: Send },
  { id: PipelineStage.INTERVIEWING, label: "Interviewing", color: "#14b8a6", icon: Users },
  { id: PipelineStage.OFFER, label: "Offer", color: "#f59e0b", icon: Star },
  { id: PipelineStage.REJECTED, label: "Rejected", color: "#ef4444", icon: XCircle },
];

interface BoardStats {
  total: number;
  thisWeek: number;
  buckets: number[];
}

function computeStats(applications: SeekerApplicationItem[]): BoardStats {
  const dayMs = 86_400_000;
  const days = 14;
  const now = Date.now();
  const buckets = new Array<number>(days).fill(0);
  let thisWeek = 0;

  for (const app of applications) {
    const raw = app.createdAt ?? app.appliedAt;
    if (!raw) continue;
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) continue;
    const diffDays = Math.floor((now - t) / dayMs);
    if (diffDays >= 0 && diffDays < days) buckets[days - 1 - diffDays]++;
    if (diffDays >= 0 && diffDays < 7) thisWeek++;
  }

  return { total: applications.length, thisWeek, buckets };
}

/* Tiny inline sparkline — applications per day over the last 14 days */
function Sparkline({ data }: { data: number[] }) {
  const width = 88;
  const height = 32;
  const max = Math.max(...data, 1);
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - 2 - (v / max) * (height - 6)}`,
    )
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#7560ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PageHeader({ stats }: { stats?: BoardStats }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          <LineChart className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-brand-foreground">
            Application Tracker
          </h1>
          <p className="mt-0.5 text-sm text-brand-foreground-muted">
            Track your job applications from applied to offer.
          </p>
        </div>
      </div>

      {stats && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ManualJobDialog />
          <div className="flex items-center gap-3 self-start rounded-xl border border-brand-border bg-white px-4 py-3 sm:self-auto">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-brand-foreground-muted">
                Total Applications
              </p>
              <p className="text-xl font-bold leading-tight text-brand-foreground">
                {stats.total}
              </p>
              <p className="text-xs font-medium text-brand-success">
                +{stats.thisWeek} this week
              </p>
            </div>
            <Sparkline data={stats.buckets} />
          </div>
        </div>
      )}
    </div>
  );
}

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
    async (appId: string) => {
      setRetryingId(appId);
      try {
        await applicationService.generateResume(appId);
        await queryClient.invalidateQueries({ queryKey: ["applications"] });
      } catch {
        toast.error("Could not start resume generation");
      } finally {
        setRetryingId(null);
      }
    },
    [queryClient],
  );

  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
    staleTime: 30_000,
  });

  const stats = useMemo(() => computeStats(applications), [applications]);

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
        <PageHeader />
        <div className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-brand-foreground-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search applications..."
            disabled
            className="w-full border-none bg-transparent text-sm text-brand-foreground outline-none placeholder:text-brand-foreground-secondary"
          />
        </div>
        <BoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <BoardError />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader stats={stats} />

      <div className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-brand-foreground-muted" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-none bg-transparent text-sm text-brand-foreground outline-none placeholder:text-brand-foreground-secondary"
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
