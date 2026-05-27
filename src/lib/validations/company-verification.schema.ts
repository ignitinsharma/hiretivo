import { z } from "zod";

/*
 * Level2SubmitSchema
 * Validates the Level 2 manual verification submission body.
 * Requires a valid LinkedIn company URL and a valid work email address.
 * Used by POST /api/recruiter/verify-company when the recruiter has a freemail domain.
 */
export const Level2SubmitSchema = z.object({
  companyLinkedInUrl: z
    .string()
    .url("Must be a valid LinkedIn URL")
    .refine((url) => url.includes("linkedin.com"), "Must be a LinkedIn company URL"),
  companyWorkEmail: z.string().email("Must be a valid email address"),
});

/*
 * AdminReviewSchema
 * Validates the admin approve/reject action body.
 * Used by PATCH /api/admin/companies/[id] to approve or reject a Level 2 submission.
 */
export const AdminReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export type Level2SubmitInput = z.infer<typeof Level2SubmitSchema>;
export type AdminReviewInput = z.infer<typeof AdminReviewSchema>;
