import { z } from "zod";

export const ProjectInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")).nullable(),
  url: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  skills: z.array(z.string().trim().min(1)).max(20).default([]),
});

export const ProjectsPayloadSchema = z.object({
  projects: z.array(ProjectInputSchema).max(20),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;
export type ProjectsPayload = z.infer<typeof ProjectsPayloadSchema>;
