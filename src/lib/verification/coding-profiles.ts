import { z } from "zod";

export const MAX_CODING_PROFILES = 5;

export const CodingProfileSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required").max(60),
  profileUrl: z
    .string()
    .trim()
    .url("Profile URL must be valid")
    .startsWith("https://", "Profile URL must start with https://")
    .max(500),
  handle: z.string().trim().max(80).optional().nullable(),
  evidenceSummary: z.string().trim().max(500).optional().nullable(),
});

export const CodingProfilesSchema = z
  .array(CodingProfileSchema)
  .max(MAX_CODING_PROFILES, `Add up to ${MAX_CODING_PROFILES} coding profiles`);

export type CodingProfileInput = z.infer<typeof CodingProfileSchema>;
export type NormalizedCodingProfile = {
  platform: string;
  profileUrl: string;
  handle: string | null;
  evidenceSummary: string | null;
};

export function normalizeCodingProfiles(value: unknown): NormalizedCodingProfile[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => CodingProfileSchema.safeParse(entry))
    .filter((result): result is z.ZodSafeParseSuccess<CodingProfileInput> => result.success)
    .map(({ data }) => ({
      platform: data.platform,
      profileUrl: data.profileUrl,
      handle: data.handle?.trim() || null,
      evidenceSummary: data.evidenceSummary?.trim() || null,
    }));
}
