'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { seekerService } from '@/services/seeker.service';
import { myApplicationsQueryKey } from '@/modules/seeker/dashboard/hooks/use-my-applications';
import {
  TRACKER_COLUMN_LABELS,
  TRACKER_COLUMNS,
  TRACKER_COLUMN_DROP_STATUS,
  TrackerColumn,
} from '@/modules/seeker/applications/utils/status-map';

interface AddApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/*
 * Form state holds `column` (the UI-facing tracker column, matching the
 * kanban vocabulary the seeker already knows) rather than the raw
 * ApplicationStatus — TRACKER_COLUMN_DROP_STATUS converts it to the actual
 * status value only at submit time, same lossy INTERVIEWING->INTERVIEW /
 * OFFER->OFFER mapping F2's drag uses.
 */
const EMPTY_FORM = { companyName: '', jobTitle: '', column: TrackerColumn.APPLIED, appliedAt: '', notes: '', externalJobUrl: '' };

/*
 * AddApplicationModal
 * Section F3 manual entry: Company + Role required, everything else
 * optional. Posts an ApplySource.MANUAL row via
 * POST /api/seeker/applications (manual branch — no jobId).
 */
export function AddApplicationModal({ open, onOpenChange }: AddApplicationModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: () =>
      seekerService.createManualApplication({
        companyName: form.companyName.trim(),
        jobTitle: form.jobTitle.trim(),
        status: TRACKER_COLUMN_DROP_STATUS[form.column],
        appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
        externalJobUrl: form.externalJobUrl.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Application added.');
      void queryClient.invalidateQueries({ queryKey: myApplicationsQueryKey });
      setForm(EMPTY_FORM);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : null;
      toast.error(message ?? 'Could not add application.');
    },
  });

  const canSubmit = form.companyName.trim().length > 0 && form.jobTitle.trim().length > 0 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="tracker-add-company">Company *</Label>
            <Input
              id="tracker-add-company"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <Label htmlFor="tracker-add-role">Role *</Label>
            <Input
              id="tracker-add-role"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="Software Engineer"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="tracker-add-status">Status</Label>
              <Select
                value={form.column}
                onValueChange={(v) => setForm((f) => ({ ...f, column: v as TrackerColumn }))}
              >
                <SelectTrigger id="tracker-add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACKER_COLUMNS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TRACKER_COLUMN_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="tracker-add-date">Date applied</Label>
              <Input
                id="tracker-add-date"
                type="date"
                value={form.appliedAt}
                onChange={(e) => setForm((f) => ({ ...f, appliedAt: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tracker-add-url">Job URL</Label>
            <Input
              id="tracker-add-url"
              type="url"
              value={form.externalJobUrl}
              onChange={(e) => setForm((f) => ({ ...f, externalJobUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="tracker-add-notes">Notes</Label>
            <Textarea
              id="tracker-add-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <Button variant="primary" disabled={!canSubmit} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Adding…' : 'Add application'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
