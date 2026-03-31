'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ApplyJobModal() {
  const { isApplyModalOpen, closeApplyModal } = useUIStore();

  return (
    <Dialog open={isApplyModalOpen} onOpenChange={closeApplyModal}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pt-2 pb-4">
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
            Apply for Senior Product Designer
          </DialogTitle>
          <p className="text-slate-500 font-medium mt-1">at Acme Corp</p>
        </DialogHeader>

        <form className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end mb-2">
              <Label htmlFor="interest" className="text-sm font-bold text-slate-900">
                What interests you about working for this company?
              </Label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Optional
              </span>
            </div>
            <Textarea
              id="interest"
              placeholder="I've been following Acme's journey in the remote collaboration space..."
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto font-bold"
              onClick={closeApplyModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto font-bold bg-primary text-white hover:bg-primary/90"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}