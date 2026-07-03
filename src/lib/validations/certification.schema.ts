import { z } from "zod";
import { HttpUrlSchema } from "@/lib/validations/http-url.schema";

const MM_YYYY_REGEX = /^(0[1-9]|1[0-2])\/\d{4}$/;

export const CertificationInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  issuer: z.string().trim().max(200).optional().nullable(),
  issueDate: z
    .string()
    .regex(MM_YYYY_REGEX, "Issue date must be in MM/YYYY format")
    .optional()
    .or(z.literal(""))
    .nullable(),
  expiryDate: z
    .string()
    .regex(MM_YYYY_REGEX, "Expiry date must be in MM/YYYY format")
    .optional()
    .or(z.literal(""))
    .nullable(),
  credentialUrl: HttpUrlSchema.optional().or(z.literal("")).nullable(),
});

export const CertificationsPayloadSchema = z.object({
  certifications: z.array(CertificationInputSchema).max(20),
});

export type CertificationInput = z.infer<typeof CertificationInputSchema>;
export type CertificationsPayload = z.infer<typeof CertificationsPayloadSchema>;
