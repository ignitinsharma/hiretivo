import { z } from "zod";

export const ScheduleInterviewSchema = z
  .object({
    applicationId: z.cuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    meetLink: z.string().url().optional().or(z.literal("")),
    notes: z.string().max(500).optional(),
    scheduledTimeZone: z.string().min(1).max(64).optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

export const RecruiterProfileSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(100),
  bio: z.string().max(500).optional(),
  companySize: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  fundingType: z.string().max(100).optional(),
  isFullyRemote: z.boolean().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const NotificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  applicationAlerts: z.boolean(),
  interviewNotifications: z.boolean(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewSchema>;
export type RecruiterProfileSettingsInput = z.infer<
  typeof RecruiterProfileSettingsSchema
>;
export type NotificationSettingsInput = z.infer<
  typeof NotificationSettingsSchema
>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
