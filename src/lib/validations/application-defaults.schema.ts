import { z } from "zod";
import { WORK_AUTH_STATUS_VALUES, SELF_ID_GENDER_VALUES, SELF_ID_ANSWER_VALUES } from "@/constants/enums";

/*
 * SelfIdSchema
 * Voluntary US-EEO self-identification — gender, ethnicity, veteran and
 * disability status. Every field optional; "prefer not to say" is always a
 * valid answer. Rendered only for US-context applications; never required.
 */
export const SelfIdSchema = z.object({
  selfIdGender: z.enum(SELF_ID_GENDER_VALUES).optional().nullable(),
  selfIdEthnicity: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  veteranStatus: z.enum(SELF_ID_ANSWER_VALUES).optional().nullable(),
  disabilityStatus: z.enum(SELF_ID_ANSWER_VALUES).optional().nullable(),
});

export type SelfIdInput = z.infer<typeof SelfIdSchema>;

/*
 * ApplicationDefaultsSchema
 * The reusable ATS-form-fill payload: location, contact, GLOBAL work
 * authorization, preferences, and voluntary US-EEO self-ID. Field set matches
 * Prisma `ApplicationDefaults` verbatim (docs/superpowers/specs/2026-07-01-
 * pivot-DATA-MODEL.md).
 */
export const ApplicationDefaultsSchema = z.object({
  // Location (ATS address fields)
  addressLine: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
  city: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  state: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")).nullable(),
  countryCode: z.string().trim().length(2, "Use a 2-letter ISO country code").optional().or(z.literal("")).nullable(),

  // Contact
  phone: z.string().trim().max(30).optional().or(z.literal("")).nullable(),
  linkedinUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")).nullable(),

  // Work authorization (global)
  workAuth: z.enum(WORK_AUTH_STATUS_VALUES).optional().nullable(),
  authorizedCountry: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  needsSponsorship: z.boolean().optional().nullable(),

  // Preferences (bool toggles; null = unanswered)
  openToOnsite: z.boolean().optional().nullable(),
  willingRelocate: z.boolean().optional().nullable(),
  startImmediately: z.boolean().optional().nullable(),

  additionalNotes: z.string().trim().max(2000).optional().or(z.literal("")).nullable(),
}).merge(SelfIdSchema);

export type ApplicationDefaultsInput = z.infer<typeof ApplicationDefaultsSchema>;
