'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useUIStore } from '@/store/use-ui-store';
import { recruiterService } from '@/services/recruiter.service';

// Duration options — typed data array per CLAUDE.md §15.1
const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
] as const;

type DurationValue = (typeof DURATION_OPTIONS)[number]['value'];

// Form schema — uses separate date/time/duration fields; API payload built on submit
const ModalFormSchema = z.object({
  date: z.date({ error: 'Please select a date' }),
  startTime: z.string().min(1, 'Please select a start time'),
  duration: z.enum(['30', '45', '60']),
  meetLink: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type ModalFormInput = z.infer<typeof ModalFormSchema>;

export interface ScheduleInterviewModalProps {
  applicationId: string;
  existingInterview?: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    meetLink: string | null;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

function getDefaultStartTime(startsAt?: Date): string {
  if (!startsAt) return '';
  const hh = String(startsAt.getUTCHours()).padStart(2, '0');
  const mm = String(startsAt.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getDefaultDuration(startsAt?: Date, endsAt?: Date): DurationValue {
  if (!startsAt || !endsAt) return '30';
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (mins === 45) return '45';
  if (mins === 60) return '60';
  return '30';
}

export function ScheduleInterviewModal({
  applicationId,
  existingInterview,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const { isScheduleModalOpen, closeScheduleModal, openPaidFeatureModal } = useUIStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isReschedule = Boolean(existingInterview);

  const form = useForm<ModalFormInput>({
    resolver: zodResolver(ModalFormSchema),
    defaultValues: {
      date: existingInterview?.startsAt ?? new Date(),
      startTime: getDefaultStartTime(existingInterview?.startsAt),
      duration: getDefaultDuration(existingInterview?.startsAt, existingInterview?.endsAt),
      meetLink: existingInterview?.meetLink ?? '',
      notes: existingInterview?.notes ?? '',
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const selectedDate = watch('date');

  const onSubmit = async (data: ModalFormInput) => {
    // Build startsAt from date + startTime (UTC)
    const [hours, minutes] = data.startTime.split(':').map(Number);
    const startsAt = new Date(data.date);
    startsAt.setUTCHours(hours, minutes, 0, 0);

    const endsAt = new Date(startsAt.getTime() + Number(data.duration) * 60_000);

    const payload = {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      meetLink: data.meetLink ?? '',
      notes: data.notes ?? '',
    };

    try {
      if (isReschedule && existingInterview) {
        await recruiterService.rescheduleInterview(existingInterview.id, payload);
      } else {
        await recruiterService.scheduleInterview({ ...payload, applicationId });
      }

      toast.success(
        isReschedule
          ? 'Interview rescheduled — both parties notified.'
          : 'Interview scheduled — both parties notified.',
      );
      closeScheduleModal();
      onSuccess();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('requires pro or enterprise')
      ) {
        closeScheduleModal();
        openPaidFeatureModal({ feature: 'interview_scheduling' });
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Failed to schedule interview. Try again.');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={isScheduleModalOpen} onOpenChange={(open) => { if (!open) closeScheduleModal(); }}>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isReschedule ? 'Reschedule Interview' : 'Schedule Interview'}</DialogTitle>
          <DialogDescription>
            Fill in the interview details to send a calendar invitation to both parties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Date field — Calendar inside Popover */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-slate-400',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue('date', date, { shouldValidate: true });
                      setIsCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Start time */}
          <div className="space-y-1.5">
            <label htmlFor="startTime" className="text-sm font-medium text-slate-700">Start time</label>
            <Input
              id="startTime"
              type="time"
              {...register('startTime')}
              aria-describedby="startTime-hint"
            />
            <p id="startTime-hint" className="text-xs text-slate-500">All times are in UTC.</p>
            {errors.startTime && (
              <p className="text-xs text-red-500">{errors.startTime.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Duration</label>
            <Select
              defaultValue={form.getValues('duration')}
              onValueChange={(val) => setValue('duration', val as DurationValue, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meet link */}
          <div className="space-y-1.5">
            <label htmlFor="meetLink" className="text-sm font-medium text-slate-700">
              Google Meet link (optional)
            </label>
            <Input
              id="meetLink"
              type="url"
              placeholder="https://meet.google.com/..."
              {...register('meetLink')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              maxLength={500}
              placeholder="Any additional details for the candidate..."
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 transition-transform hover:scale-105 active:scale-95"
              onClick={closeScheduleModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-primary text-white transition-transform hover:scale-105 hover:bg-brand-primary/90 active:scale-95"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : isReschedule ? (
                'Update Interview'
              ) : (
                'Schedule Interview'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
