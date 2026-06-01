"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  buildUtcFromLocalTime,
  detectBrowserTimezone,
  COMMON_TIMEZONES,
  getAllTimezones,
  getCalendarDateInTimezone,
  isValidTimezone,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/use-ui-store";
import { recruiterService } from "@/services/recruiter.service";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Duration options — typed data array per CLAUDE.md §15.1
const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
] as const;

type DurationValue = (typeof DURATION_OPTIONS)[number]["value"];

const COMMON_TIMEZONE_VALUES = new Set(
  COMMON_TIMEZONES.map((timezone) => timezone.value),
);

function formatTimezoneLabel(timezone: string): string {
  const commonTimezone = COMMON_TIMEZONES.find((option) => option.value === timezone);
  if (commonTimezone) return commonTimezone.label;

  return timezone
    .replaceAll("_", " ")
    .replace("/", " / ");
}

function getTimezoneOptions() {
  return [
    ...COMMON_TIMEZONES,
    ...getAllTimezones()
      .filter((timezone) => !COMMON_TIMEZONE_VALUES.has(timezone))
      .map((timezone) => ({
        value: timezone,
        label: formatTimezoneLabel(timezone),
      })),
  ];
}

// Form schema — uses separate date/time/duration fields; API payload built on submit
const ModalFormSchema = z.object({
  date: z.date({ error: "Please select a date" }),
  startTime: z.string().min(1, "Please select a start time"),
  duration: z.enum(["30", "45", "60"]),
  scheduledTimeZone: z
    .string()
    .min(1, "Please enter a timezone")
    .refine(isValidTimezone, "Please enter a valid timezone"),
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
    scheduledTimeZone?: string | null;
  } | null;
  onSuccess: () => void;
}

function getDefaultStartTime(startsAt?: Date, tz?: string | null): string {
  if (!startsAt) return "";
  const locale = tz && isValidTimezone(tz) ? tz : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: locale,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(startsAt);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const hh = hour === "24" ? "00" : hour;
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

interface TimezoneComboboxProps {
  value: string;
  errorMessage?: string;
  onValueChange: (value: string) => void;
}

function TimezoneCombobox({
  value,
  errorMessage,
  onValueChange,
}: TimezoneComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const options = useMemo(getTimezoneOptions, []);
  const filteredOptions = options
    .filter((option) => {
      const search = query.trim().toLowerCase();
      if (!search) return true;
      return (
        option.value.toLowerCase().includes(search) ||
        option.label.toLowerCase().includes(search)
      );
    })
    .slice(0, 80);
  const displayValue = value ? formatTimezoneLabel(value) : "Select timezone";

  return (
    <div className="space-y-1.5">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="default"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] rounded-xl border border-brand-border bg-white p-2 shadow-none" align="start">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-foreground-muted" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                onValueChange(event.target.value);
              }}
              placeholder="Search or enter IANA timezone"
              className="pl-9"
            />
          </div>
          <div className="mt-2 max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-brand-foreground-muted">
                No matches. Enter a valid IANA timezone.
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-brand-surface",
                    option.value === value && "bg-brand-surface text-brand-primary",
                  )}
                  onClick={() => {
                    setQuery(option.value);
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    <span className="block truncate text-xs text-brand-foreground-muted">
                      {option.value}
                    </span>
                  </span>
                  {option.value === value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage ? (
        <p className="text-xs text-red-500">{errorMessage}</p>
      ) : (
        <p className="text-xs text-brand-foreground-muted">
          Use an IANA timezone such as America/New_York or Asia/Kolkata.
        </p>
      )}
    </div>
  );
}

function getDefaultDuration(startsAt?: Date, endsAt?: Date): DurationValue {
  if (!startsAt || !endsAt) return "30";
  const mins = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (mins === 45) return "45";
  if (mins === 60) return "60";
  return "30";
}

export function ScheduleInterviewModal({
  applicationId,
  existingInterview,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const { isScheduleModalOpen, closeScheduleModal, openPaidFeatureModal } =
    useUIStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isReschedule = Boolean(existingInterview);
  const defaultTimezone =
    existingInterview?.scheduledTimeZone &&
    isValidTimezone(existingInterview.scheduledTimeZone)
      ? existingInterview.scheduledTimeZone
      : detectBrowserTimezone();

  const form = useForm<ModalFormInput>({
    resolver: zodResolver(ModalFormSchema),
    defaultValues: {
      date: existingInterview?.startsAt
        ? getCalendarDateInTimezone(existingInterview.startsAt, defaultTimezone)
        : new Date(),
      startTime: getDefaultStartTime(existingInterview?.startsAt, defaultTimezone),
      duration: getDefaultDuration(
        existingInterview?.startsAt,
        existingInterview?.endsAt,
      ),
      scheduledTimeZone: defaultTimezone,
      meetLink: existingInterview?.meetLink ?? "",
      notes: existingInterview?.notes ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const selectedDate = watch("date");
  const selectedTimezone = watch("scheduledTimeZone");

  const onSubmit = async (data: ModalFormInput) => {
    const startsAt = buildUtcFromLocalTime(data.date, data.startTime, data.scheduledTimeZone);
    const endsAt = new Date(startsAt.getTime() + Number(data.duration) * 60_000);

    const payload = {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      scheduledTimeZone: data.scheduledTimeZone,
      meetLink: data.meetLink ?? "",
      notes: data.notes ?? "",
    };

    try {
      if (isReschedule && existingInterview) {
        await recruiterService.rescheduleInterview(
          existingInterview.id,
          payload,
        );
      } else {
        await recruiterService.scheduleInterview({ ...payload, applicationId });
      }

      toast.success(
        isReschedule
          ? "Interview rescheduled — both parties notified."
          : "Interview scheduled — both parties notified.",
      );
      closeScheduleModal();
      onSuccess();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("requires pro or enterprise")
      ) {
        closeScheduleModal();
        openPaidFeatureModal({ feature: "interview_scheduling" });
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to schedule interview. Try again.",
      );
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog
      open={isScheduleModalOpen}
      onOpenChange={(open) => {
        if (!open) closeScheduleModal();
      }}
    >
      <DialogContent className="rounded-xl sm:max-w-140">
        <DialogHeader>
          <DialogTitle>
            {isReschedule ? "Reschedule Interview" : "Schedule Interview"}
          </DialogTitle>
          <DialogDescription>
            Fill in the interview details to send a calendar invitation to both
            parties.
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
                  variant="default"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-slate-400",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("date", date, { shouldValidate: true });
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

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Timezone
            </label>
            <TimezoneCombobox
              value={selectedTimezone}
              errorMessage={errors.scheduledTimeZone?.message}
              onValueChange={(val) =>
                setValue("scheduledTimeZone", val, { shouldValidate: true })
              }
            />
          </div>

          {/* Start time */}
          <div className="space-y-1.5">
            <label
              htmlFor="startTime"
              className="text-sm font-medium text-slate-700"
            >
              Start time
            </label>
            <Input
              id="startTime"
              type="time"
              {...register("startTime")}
              aria-describedby="startTime-hint"
            />
            <p id="startTime-hint" className="text-xs text-slate-500">
              Time in selected timezone above.
            </p>
            {errors.startTime && (
              <p className="text-xs text-red-500">{errors.startTime.message}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Duration
            </label>
            <Select
              defaultValue={form.getValues("duration")}
              onValueChange={(val) =>
                setValue("duration", val as DurationValue, {
                  shouldValidate: true,
                })
              }
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
            <label
              htmlFor="meetLink"
              className="text-sm font-medium text-slate-700"
            >
              Google Meet link (optional)
            </label>
            <Input
              id="meetLink"
              type="url"
              placeholder="https://meet.google.com/..."
              {...register("meetLink")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-slate-700"
            >
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              maxLength={500}
              placeholder="Any additional details for the candidate..."
              {...register("notes")}
            />
          </div>

          <div className="flex items-end gap-2 pt-2">
            <Button
              type="button"
              variant="default"
              onClick={closeScheduleModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant={"primary"} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : isReschedule ? (
                "Update Interview"
              ) : (
                "Schedule Interview"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
