'use client';

import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox, Plus, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seekerService } from '@/services/seeker.service';
import { myApplicationsQueryKey } from '@/modules/seeker/dashboard/hooks/use-my-applications';
import { useTrackerApplications } from '@/modules/seeker/tracker/hooks/use-tracker-applications';
import { TRACKER_COLUMN_DROP_STATUS, TrackerColumn } from '@/modules/seeker/applications/utils/status-map';
import { KanbanColumn } from '@/modules/seeker/tracker/components/KanbanColumn';
import { KanbanCard } from '@/modules/seeker/tracker/components/KanbanCard';
import { AddApplicationModal } from '@/modules/seeker/tracker/components/AddApplicationModal';
import type { DashboardApplicationSummary } from '@/modules/seeker/dashboard/types/applications-table.types';

/*
 * TrackerKanbanBoard
 * /dashboard/tracker's whole page body (Section F). 5-column kanban grouped
 * from the shared applications list, drag-and-drop status changes
 * (optimistic + rollback), CSV import/export, and manual "Add application".
 * Mobile: the column row scrolls horizontally (overflow-x-auto) — CLAUDE.md
 * requires the page body itself never scroll sideways, only this container.
 */
export function TrackerKanbanBoard() {
  const queryClient = useQueryClient();
  const { columns, totalCards, isLoading, isError, refetch } = useTrackerApplications();
  const [activeCard, setActiveCard] = useState<DashboardApplicationSummary | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const moveMutation = useMutation({
    mutationFn: ({ cardId, to }: { cardId: string; to: TrackerColumn }) =>
      seekerService.updateApplication(cardId, { status: TRACKER_COLUMN_DROP_STATUS[to] }),
    onMutate: async ({ cardId, to }) => {
      await queryClient.cancelQueries({ queryKey: myApplicationsQueryKey });
      const previous = queryClient.getQueryData<DashboardApplicationSummary[]>(myApplicationsQueryKey);
      queryClient.setQueryData<DashboardApplicationSummary[]>(myApplicationsQueryKey, (old) =>
        old?.map((row) => (row.id === cardId ? { ...row, status: TRACKER_COLUMN_DROP_STATUS[to] } : row)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(myApplicationsQueryKey, context.previous);
      toast.error('Could not update status. Try again.');
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey }),
  });

  const handleStatusChange = (cardId: string, from: TrackerColumn, to: TrackerColumn) => {
    if (from === to) return;
    moveMutation.mutate({ cardId, to });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const found = columns.flatMap((c) => c.cards).find((c) => c.id === event.active.id);
    setActiveCard(found ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const to = event.over?.id as TrackerColumn | undefined;
    const from = event.active.data.current?.column as TrackerColumn | undefined;
    if (!to || !from) return;
    handleStatusChange(event.active.id as string, from, to);
  };

  const handleExport = () => window.open('/api/seeker/tracker/export', '_blank');

  const handleImportFile = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      const csv = typeof reader.result === 'string' ? reader.result : '';
      seekerService
        .importTrackerCsv(csv)
        .then((res) => {
          const { created, skipped, errors } = res.data;
          toast.success(`Imported ${created}, skipped ${skipped}${errors.length ? `, ${errors.length} error(s)` : ''}.`);
          if (errors.length > 0) {
            errors.slice(0, 3).forEach((e) => toast.error(`Row ${e.row}: ${e.reason}`));
          }
          void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey });
        })
        .catch(() => toast.error('Import failed. Check the file and try again.'))
        .finally(() => setImporting(false));
    };
    reader.onerror = () => {
      toast.error('Could not read file.');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-brand-border bg-brand-surface p-3">
            <div className="h-4 w-20 animate-pulse rounded-lg bg-white" />
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-20 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-brand-border p-10 text-center">
        <p className="text-sm text-brand-foreground-muted">Couldn&apos;t load your tracker.</p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-snug tracking-tight text-brand-foreground">Application tracker</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = '';
              }}
            />
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-border px-3 text-sm font-medium text-brand-foreground hover:bg-brand-surface">
              <Upload className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </span>
          </label>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add application
          </Button>
        </div>
      </div>

      {totalCards === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-brand-border p-10 text-center">
          <Inbox className="h-8 w-8 text-brand-foreground-secondary" />
          <p className="text-sm font-medium text-brand-foreground">No applications yet.</p>
          <p className="text-sm text-brand-foreground-muted">Browse jobs to start applying.</p>
          <Button asChild variant="primary" size="sm">
            <a href="/dashboard/browse">Browse jobs</a>
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(({ column, cards }) => (
              <KanbanColumn key={column} column={column} cards={cards} onDropdownStatusChange={handleStatusChange} />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? (
              <KanbanCard
                card={activeCard}
                column={columns.find((c) => c.cards.some((card) => card.id === activeCard.id))?.column ?? TrackerColumn.APPLIED}
                onDropdownStatusChange={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AddApplicationModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
