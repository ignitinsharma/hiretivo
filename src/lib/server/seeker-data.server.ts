import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { getProfileStrengthSummary } from "@/lib/seeker-dashboard";
import { parseLegacyLocation } from "@/modules/india-location/helpers";
import type { SeekerSettingsData } from "@/services/seeker.service";

const SITUATION_VALUE_MAP: Record<string, string> = {
  ACTIVELY_LOOKING: "ACTIVELY_LOOKING",
  "ACTIVELY LOOKING": "ACTIVELY_LOOKING",
  OPEN_TO_OFFERS: "OPEN_TO_OFFERS",
  "OPEN TO OFFERS": "OPEN_TO_OFFERS",
  EXPLORING_OPTIONS: "EXPLORING_OPTIONS",
  "EXPLORING OPTIONS": "EXPLORING_OPTIONS",
  STUDENT_FRESH_GRAD: "STUDENT_FRESH_GRAD",
  "STUDENT FRESH GRAD": "STUDENT_FRESH_GRAD",
  "STUDENT / FRESH GRAD": "STUDENT_FRESH_GRAD",
  "STUDENT/FRESH GRAD": "STUDENT_FRESH_GRAD",
};

const AVAILABILITY_VALUE_MAP: Record<string, string> = {
  IMMEDIATELY: "IMMEDIATELY",
  TWO_WEEKS: "TWO_WEEKS",
  "TWO WEEKS": "TWO_WEEKS",
  "2 WEEKS": "TWO_WEEKS",
  "2 WEEKS NOTICE": "TWO_WEEKS",
  ONE_MONTH_PLUS: "ONE_MONTH_PLUS",
  "ONE MONTH PLUS": "ONE_MONTH_PLUS",
  "1 MONTH": "ONE_MONTH_PLUS",
  "1 MONTH+": "ONE_MONTH_PLUS",
  "1 MONTH PLUS": "ONE_MONTH_PLUS",
};

/*
 * normalizeSelectValue
 * Converts legacy display labels into canonical enum-like strings.
 * Returns null for blank/missing values and preserves unknown non-blank values.
 */
function normalizeSelectValue(
  value: string | null | undefined,
  map: Record<string, string>,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const key = trimmed.replace(/[_-]+/g, " ").toUpperCase();
  return map[trimmed.toUpperCase()] ?? map[key] ?? trimmed;
}

/*
 * fetchSeekerSettingsForPrefetch
 * Direct Prisma query for seeker settings — used in layout server prefetch.
 * Returns null when profile is missing so the layout can skip hydration.
 * @param userId - Authenticated user id from session
 */
export async function fetchSeekerSettingsForPrefetch(
  userId: string,
): Promise<{ data: SeekerSettingsData } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          situation: true,
          primaryRole: true,
          workPreference: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          resumeKey: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          twitterUrl: true,
          yearsExperience: true,
          workExperiences: { orderBy: { createdAt: "asc" as const } },
          educations: { orderBy: { createdAt: "asc" as const } },
          skills: {
            include: {
              skill: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!user?.seekerProfile) return null;

  const { seekerProfile, image, ...userFields } = user;
  const { skills, workExperiences, educations, ...profileFields } =
    seekerProfile;

  const { city, state: derivedState } = parseLegacyLocation(
    profileFields.location,
  );

  return {
    data: {
      ...userFields,
      image: resolveLogoUrl(image),
      ...profileFields,
      situation:
        normalizeSelectValue(profileFields.situation, SITUATION_VALUE_MAP) ??
        "",
      availability:
        normalizeSelectValue(
          profileFields.availability,
          AVAILABILITY_VALUE_MAP,
        ) ?? "",
      city,
      state: derivedState,
      skills: skills.map((s) => s.skill),
      workExperiences,
      educations,
      profileStrength: getProfileStrengthSummary(profileFields),
    } as SeekerSettingsData,
  };
}
