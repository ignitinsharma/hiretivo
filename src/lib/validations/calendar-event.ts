import { z } from "zod";

/* Validates dates and details saved for a local application event. */
export const calendarEventSchema = z.object({
  kind: z.enum(["INTERVIEW", "DEADLINE"]),
  title: z.string().trim().min(1).max(120),
  startsAt: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const createCalendarEventSchema = calendarEventSchema.extend({
  applicationId: z.string().min(1),
});
