import { z } from "zod";

/* Client + server input for POST /api/seeker/apply/from-link. Only http(s)
 * is accepted — jd-fetch.ts still re-validates scheme + resolved IP before
 * fetching (defense in depth against SSRF), this just rejects obviously
 * unsafe schemes (javascript:, file:, ftp:, ...) at the boundary. */
export const ApplyFromLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Enter a valid job posting URL.")
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), "Only http:// or https:// URLs are supported."),
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
