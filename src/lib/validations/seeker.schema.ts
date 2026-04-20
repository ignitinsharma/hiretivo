import { z } from "zod";

export const SeekerSettingsSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    headline: z.string().max(200).optional().or(z.literal("")),
    bio: z.string().max(1000).optional().or(z.literal("")),
    location: z.string().max(200).optional().or(z.literal("")),
    situation: z.string().max(200).optional().or(z.literal("")),
    primaryRole: z.string().max(100).optional().or(z.literal("")),
    salaryMin: z.number().int().min(0).nullable().optional(),
    salaryMax: z.number().int().min(0).nullable().optional(),
    currency: z.string().max(10).optional().or(z.literal("")),
    availability: z.string().max(100).optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      data.salaryMax == null ||
      data.salaryMin == null ||
      data.salaryMin <= data.salaryMax,
    {
      message: "Minimum salary must be less than or equal to maximum salary",
      path: ["salaryMax"],
    },
  )
  .transform((data) => ({
    ...data,
    salaryMin: data.salaryMin ?? null,
    salaryMax: data.salaryMax ?? null,
  }));

export type SeekerSettingsInput = z.input<typeof SeekerSettingsSchema>;
