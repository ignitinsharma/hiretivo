'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApplyFromLink } from '@/modules/seeker/apply/hooks/use-apply-from-link';
import { ApplyFromLinkSchema, type ApplyFromLinkInput } from '@/lib/validations/apply-from-link.schema';

const COPY = {
  title: 'Add your own link',
  description: 'Paste a job posting URL — we’ll pull the details and start your tailored application.',
  urlLabel: 'Job posting URL',
  urlPlaceholder: 'https://company.com/careers/senior-engineer',
  pasteLabel: 'Paste the job description',
  pastePlaceholder: 'Paste the full job description text here...',
  submit: 'Continue',
  submitting: 'Reading job posting...',
};

interface AddLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/*
 * AddLinkModal
 * Dialog for the "add your own link" entry point: a URL field, with a
 * JD-paste textarea that appears when the server signals needsManualPaste
 * (blocked/unreadable site). Submits via useApplyFromLink, which redirects
 * into the Phase-5 wizard on success.
 */
export function AddLinkModal({ open, onOpenChange }: AddLinkModalProps) {
  const { submit, isPending, isError, error, needsManualPaste, manualPasteReason } = useApplyFromLink();
  const form = useForm<ApplyFromLinkInput>({
    resolver: zodResolver(ApplyFromLinkSchema),
    defaultValues: { url: '', pastedText: '' },
  });

  useEffect(() => {
    if (!open) form.reset({ url: '', pastedText: '' });
  }, [open, form]);

  const onSubmit = (values: ApplyFromLinkInput) => {
    submit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border border-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{COPY.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <p className="text-sm text-brand-foreground-muted">{COPY.description}</p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="apply-from-link-url">{COPY.urlLabel}</Label>
            <Input
              id="apply-from-link-url"
              type="url"
              placeholder={COPY.urlPlaceholder}
              aria-invalid={!!form.formState.errors.url}
              {...form.register('url')}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-brand-danger">{form.formState.errors.url.message}</p>
            )}
          </div>

          {needsManualPaste && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="apply-from-link-pasted-text">{COPY.pasteLabel}</Label>
              <p className="text-sm text-brand-foreground-muted">{manualPasteReason}</p>
              <Textarea
                id="apply-from-link-pasted-text"
                rows={8}
                placeholder={COPY.pastePlaceholder}
                {...form.register('pastedText')}
              />
            </div>
          )}

          {isError && <p className="text-sm text-brand-danger">{error}</p>}

          <DialogFooter>
            <Button type="submit" variant="primary" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? COPY.submitting : COPY.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
