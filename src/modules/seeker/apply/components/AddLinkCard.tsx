'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddLinkModal } from '@/modules/seeker/apply/components/AddLinkModal';

/*
 * AddLinkCard
 * Entry point for Phase 7 — lets a seeker paste any job URL Hiretivo doesn't
 * already ingest and start the same assisted-apply wizard used from the feed.
 */
export function AddLinkCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/5">
            <Plus className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-brand-foreground">Have a job link we don’t have yet?</h3>
            <p className="text-sm text-brand-foreground-muted">
              Paste any job posting URL and we’ll get it into your wizard.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          Add your own link
        </Button>
      </div>
      <AddLinkModal open={open} onOpenChange={setOpen} />
    </>
  );
}
