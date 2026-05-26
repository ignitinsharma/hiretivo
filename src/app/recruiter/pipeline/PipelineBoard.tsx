/*
 * PipelineBoard
 * Renders a 6-column kanban board (Applied / Reviewing / Interview / Offer / Hired / Rejected)
 * with pipeline cards fetched via TanStack Query. Supports optimistic status moves that
 * instantly move cards between columns and persist via PATCH.
 * Mobile: horizontal scroll. Desktop: all 6 columns visible side-by-side.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { PipelineCard } from "./PipelineCard";

interface PipelineCardData {
  id: string;
  engineerId: string;
  engineerName: string;
  isBlurred: boolean;
  jobTitle: string;
  matchScore: number;
  appliedAt: string;
  status: string;
}

interface PipelineResponse {
  columns: Record<string, PipelineCardData[]>;
}

const PIPELINE_COLUMNS = [
  { status: "APPLIED", label: "Applied", color: "bg-gray-100" },
  { status: "REVIEWING", label: "Reviewing", color: "bg-blue-50" },
  { status: "INTERVIEW", label: "Interview", color: "bg-purple-50" },
  { status: "OFFER", label: "Offer", color: "bg-amber-50" },
  { status: "HIRED", label: "Hired", color: "bg-green-50" },
  { status: "REJECTED", label: "Rejected", color: "bg-red-50" },
] as const;

function ColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 lg:flex-1 lg:min-w-[11rem] flex flex-col gap-3">
      <div className="rounded-lg bg-gray-100 h-8 w-full animate-pulse" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-gray-100 h-28 animate-pulse" />
      ))}
    </div>
  );
}

export function PipelineBoard() {
  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<PipelineResponse>({
    queryKey: ["pipeline"],
    queryFn: async () => {
      const res = await fetch("/api/recruiter/pipeline");
      if (!res.ok) {
        throw new Error("Failed to fetch pipeline data");
      }
      return res.json();
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await fetch(
        `/api/recruiter/application/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to update status");
      }
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previousData = queryClient.getQueryData<PipelineResponse>([
        "pipeline",
      ]);

      setMovingId(id);

      queryClient.setQueryData<PipelineResponse>(["pipeline"], (old) => {
        if (!old) return old;
        const columns = { ...old.columns };
        let movedCard: PipelineCardData | undefined;

        for (const colKey of Object.keys(columns)) {
          const col = [...columns[colKey]];
          const idx = col.findIndex((c) => c.id === id);
          if (idx !== -1) {
            movedCard = col[idx];
            columns[colKey] = col.filter((c) => c.id !== id);
          } else {
            columns[colKey] = col;
          }
        }

        if (movedCard) {
          columns[status] = [
            { ...movedCard, status },
            ...(columns[status] ?? []),
          ];
        }

        return { columns };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["pipeline"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      setMovingId(null);
    },
  });

  const handleMove = (id: string, status: string) => {
    mutation.mutate({ id, status });
  };

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
        {PIPELINE_COLUMNS.map((col) => (
          <ColumnSkeleton key={col.status} />
        ))}
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-brand-foreground-muted text-sm">
          Failed to load pipeline data.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-surface transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const columns = data?.columns;
  const allCards = Object.values(columns ?? {}).flat();

  /* ── Empty state (no applications at all) ── */
  if (!allCards.length) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
        {PIPELINE_COLUMNS.map((col) => (
          <div
            key={col.status}
            className="flex-shrink-0 w-72 lg:flex-1 lg:min-w-[11rem] flex flex-col gap-3"
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-brand-foreground flex items-center justify-between ${col.color}`}
            >
              <span>{col.label}</span>
              <span className="text-xs bg-white/70 rounded px-1.5 py-0.5">
                0
              </span>
            </div>
            {col.status === "APPLIED" && (
              <p className="text-sm text-brand-foreground-secondary italic text-center py-8">
                No applications yet. Post a job to start receiving applications.
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ── Board ── */
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
      {PIPELINE_COLUMNS.map((col) => {
        const colCards = columns?.[col.status] ?? [];
        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-72 lg:flex-1 lg:min-w-[11rem] flex flex-col gap-3"
          >
            {/* Column header */}
            <div
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-brand-foreground flex items-center justify-between ${col.color}`}
            >
              <span>{col.label}</span>
              <span className="text-xs bg-white/70 rounded px-1.5 py-0.5">
                {colCards.length}
              </span>
            </div>

            {/* Cards */}
            {colCards.length === 0 ? (
              <p className="text-sm text-brand-foreground-secondary italic text-center py-8">
                No candidates
              </p>
            ) : (
              colCards.map((card) => (
                <PipelineCard
                  key={card.id}
                  card={card}
                  onMove={handleMove}
                  isMoving={movingId === card.id}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
