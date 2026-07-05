'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FileText, Mail, Link2, RotateCcw, MoreVertical, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { seekerService } from '@/services/seeker.service';
import { ApplySource } from '@/constants/enums';
import { TRACKER_COLUMN_LABELS, TRACKER_COLUMNS, TrackerColumn } from '@/modules/seeker/applications/utils/status-map';
import type { TrackerCard as TrackerCardData } from '@/modules/seeker/tracker/types/tracker.types';

interface KanbanCardProps {
  card: TrackerCardData;
  column: TrackerColumn;
  onDropdownStatusChange: (cardId: string, from: TrackerColumn, to: TrackerColumn) => void;
}

/*
 * CoverLetterDialog
 * Fetches + shows the full cover letter text on demand (not carried in the
 * list summary — only hasCoverLetter is). Single-use, co-located with its
 * only caller.
 */
function CoverLetterDialog({ applicationId, open, onOpenChange }: { applicationId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [text, setText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next && text === null) {
      seekerService
        .getApplication(applicationId)
        .then((res) => setText(res.data.coverLetter ?? 'No cover letter generated for this application.'))
        .catch(() => setText('Could not load cover letter.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Cover letter</DialogTitle>
        </DialogHeader>
        <p className="whitespace-pre-wrap text-sm text-brand-foreground">{text ?? 'Loading…'}</p>
        {text && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-fit"
            onClick={() => {
              void navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                toast.success('Copied!');
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

/*
 * KanbanCard
 * One tracker card: company/role/date + quick-action icons (resume PDF,
 * cover letter, job posting, reopen wizard) + a three-dot status dropdown
 * (F2's mobile fallback for drag). Draggable via @dnd-kit — a small
 * PointerSensor activation distance (set on the parent DndContext) keeps
 * icon-button clicks from being swallowed as a drag start.
 */
export function KanbanCard({ card, column, onDropdownStatusChange }: KanbanCardProps) {
  const router = useRouter();
  const [coverOpen, setCoverOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { column },
  });

  const canReopen = card.jobId !== null || card.source === ApplySource.PASTED_LINK;

  const handleOpenResume = async () => {
    if (!card.isFinalized) {
      toast.error('No resume generated for this application.');
      return;
    }
    try {
      const detail = await seekerService.getApplication(card.id);
      if (detail.data.tailoredResumeUrl) window.open(detail.data.tailoredResumeUrl, '_blank');
      else toast.error('No resume generated for this application.');
    } catch {
      toast.error('Could not load resume.');
    }
  };

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        'rounded-lg border border-brand-border bg-white p-3 text-sm ' +
        (isDragging ? 'opacity-50' : 'cursor-grab active:cursor-grabbing')
      }
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-brand-foreground">{card.companyName}</p>
          <p className="truncate text-xs text-brand-foreground-muted">{card.jobTitle}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              className="shrink-0 rounded-lg p-1 text-brand-foreground-secondary hover:bg-brand-surface"
              aria-label="Change status"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {TRACKER_COLUMNS.map((c) => (
              <DropdownMenuItem
                key={c}
                disabled={c === column}
                onClick={() => onDropdownStatusChange(card.id, column, c)}
              >
                {TRACKER_COLUMN_LABELS[c]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-1 text-xs text-brand-foreground-secondary">{format(new Date(card.createdAt), 'MMM d, yyyy')}</p>

      <div className="mt-2 flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleOpenResume}
          className="rounded-lg p-1.5 text-brand-foreground-secondary hover:bg-brand-surface hover:text-brand-foreground"
          aria-label="Open resume PDF"
          title="Resume PDF"
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCoverOpen(true)}
          className="rounded-lg p-1.5 text-brand-foreground-secondary hover:bg-brand-surface hover:text-brand-foreground"
          aria-label="Open cover letter"
          title="Cover letter"
        >
          <Mail className="h-4 w-4" />
        </button>
        {card.applyUrl && (
          <button
            type="button"
            onClick={() => window.open(card.applyUrl!, '_blank')}
            className="rounded-lg p-1.5 text-brand-foreground-secondary hover:bg-brand-surface hover:text-brand-foreground"
            aria-label="Open job posting"
            title="Job posting"
          >
            <Link2 className="h-4 w-4" />
          </button>
        )}
        {canReopen && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/applications/${card.id}`)}
            className="rounded-lg p-1.5 text-brand-foreground-secondary hover:bg-brand-surface hover:text-brand-foreground"
            aria-label="Reopen application wizard"
            title="Reopen wizard"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <CoverLetterDialog applicationId={card.id} open={coverOpen} onOpenChange={setCoverOpen} />
    </div>
  );
}
