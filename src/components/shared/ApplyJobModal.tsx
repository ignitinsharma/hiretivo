'use client';

import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ApplyJobModal() {
  const { isApplyModalOpen, closeApplyModal, selectedJobId, selectedJobTitle, selectedCompanyName } = useUIStore();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, coverLetter }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error("You've already applied to this job.");
        }
        if (res.status === 403) {
          throw new Error('Only job seekers can apply.');
        }
        throw new Error((data as { error?: string }).error ?? 'Failed to apply');
      }

      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application submitted!');
      setCoverLetter('');
      closeApplyModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isApplyModalOpen} onOpenChange={closeApplyModal}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pt-2 pb-4">
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
            Apply for {selectedJobTitle || 'this position'}
          </DialogTitle>
          <p className="text-slate-500 font-medium mt-1">at {selectedCompanyName || 'this company'}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="I've been following this company's journey..."
              className="min-h-[150px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto font-bold"
              onClick={closeApplyModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto font-bold bg-primary text-white hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
