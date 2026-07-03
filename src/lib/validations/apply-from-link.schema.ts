import { z } from "zod";

/* Client + server input for POST /api/seeker/apply/from-link. */
export const ApplyFromLinkSchema = z.object({
  url: z.string().trim().url("Enter a valid job posting URL.").max(2048),
  pastedText: z.string().trim().max(20000).optional(),
});
export type ApplyFromLinkInput = z.infer<typeof ApplyFromLinkSchema>;

/* Validates buildJdExtractMessages' raw model output before it is trusted. */
export const JdExtractOutputSchema = z.object({
  title: z.string().default(""),
  company: z.string().nullable().default(null),
  description: z.string().default(""),
  skills: z.array(z.string()).max(12).default([]),
});
export type JdExtractOutput = z.infer<typeof JdExtractOutputSchema>;
