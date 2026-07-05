'use client';

import { useDroppable } from '@dnd-kit/core';
import { TRACKER_COLUMN_LABELS, type TrackerColumn } from '@/modules/seeker/applications/utils/status-map';
import { KanbanCard } from '@/modules/seeker/tracker/components/KanbanCard';
import type { TrackerCard } from '@/modules/seeker/tracker/types/tracker.types';

interface KanbanColumnProps {
  column: TrackerColumn;
  cards: TrackerCard[];
  onDropdownStatusChange: (cardId: string, from: TrackerColumn, to: TrackerColumn) => void;
}

/*
 * KanbanColumn
 * One tracker column — header (label + count) and its cards. A droppable
 * zone for F2's drag-and-drop; always renders "No applications" when empty
 * rather than hiding, so the column's existence is visible (per plan).
 */
export function KanbanColumn({ column, cards, onDropdownStatusChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div
      ref={setNodeRef}
      className={
        'flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-brand-border bg-brand-surface p-3 ' +
        (isOver ? 'border-brand-primary' : '')
      }
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-brand-foreground">{TRACKER_COLUMN_LABELS[column]}</h3>
        <span className="text-xs text-brand-foreground-muted">{cards.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-border p-4 text-center text-xs text-brand-foreground-secondary">
            No applications
          </p>
        ) : (
          cards.map((card) => (
            <KanbanCard key={card.id} card={card} column={column} onDropdownStatusChange={onDropdownStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}
