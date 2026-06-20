import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { getProfileStrengthSummary } from "@/lib/seeker-dashboard";
import { parseLegacyLocation } from "@/modules/india-location/helpers";
import { SeekerAvailability, SeekerSituation } from "@/constants/enums";
import type { SeekerSettingsData } from "@/services/seeker.service";

const SITUATION_VALUE_MAP: Record<string, SeekerSituation> = {
  ACTIVELY_LOOKING: SeekerSituation.ACTIVELY_LOOKING,
  "ACTIVELY LOOKING": SeekerSituation.ACTIVELY_LOOKING,
  OPEN_TO_OFFERS: SeekerSituation.OPEN_TO_OFFERS,
  "OPEN TO OFFERS": SeekerSituation.OPEN_TO_OFFERS,
  EXPLORING_OPTIONS: SeekerSituation.EXPLORING_OPTIONS,
  "EXPLORING OPTIONS": SeekerSituation.EXPLORING_OPTIONS,
  STUDENT_FRESH_GRAD: SeekerSituation.STUDENT_FRESH_GRAD,
  "STUDENT FRESH GRAD": SeekerSituation.STUDENT_FRESH_GRAD,
  "STUDENT / FRESH GRAD": SeekerSituation.STUDENT_FRESH_GRAD,
  "STUDENT/FRESH GRAD": SeekerSituation.STUDENT_FRESH_GRAD,
};

const AVAILABILITY_VALUE_MAP: Record<string, SeekerAvailability> = {
  IMMEDIATELY: SeekerAvailability.IMMEDIATELY,
  TWO_WEEKS: SeekerAvailability.TWO_WEEKS,
  "TWO WEEKS": SeekerAvailability.TWO_WEEKS,
  "2 WEEKS": SeekerAvailability.TWO_WEEKS,
  "2 WEEKS NOTICE": SeekerAvailability.TWO_WEEKS,
  ONE_MONTH_PLUS: SeekerAvailability.ONE_MONTH_PLUS,
  "ONE MONTH PLUS": SeekerAvailability.ONE_MONTH_PLUS,
  "1 MONTH": SeekerAvailability.ONE_MONTH_PLUS,
  "1 MONTH+": SeekerAvailability.ONE_MONTH_PLUS,
  "1 MONTH PLUS": SeekerAvailability.ONE_MONTH_PLUS,
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
          workExperiences: {
            orderBy: { createdAt: "asc" as const },
            select: {
              id: true,
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
              positionType: true,
              skills: true,
            },
          },
          educations: {
            orderBy: { createdAt: "asc" as const },
            select: {
              id: true,
              institution: true,
              graduationDate: true,
              degree: true,
              major: true,
            },
          },
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
      name: userFields.name ?? "",
      email: userFields.email ?? "",
      image: resolveLogoUrl(image),
      headline: profileFields.headline ?? "",
      bio: profileFields.bio ?? "",
      location: profileFields.location ?? null,
      city,
      state: derivedState,
      situation:
        normalizeSelectValue(profileFields.situation, SITUATION_VALUE_MAP) ??
        "",
      primaryRole: profileFields.primaryRole ?? "",
      workPreference: profileFields.workPreference ?? null,
      salaryMin: profileFields.salaryMin ?? null,
      salaryMax: profileFields.salaryMax ?? null,
      currency: profileFields.currency ?? "",
      availability:
        normalizeSelectValue(
          profileFields.availability,
          AVAILABILITY_VALUE_MAP,
        ) ?? "",
      resumeKey: profileFields.resumeKey ?? null,
      websiteUrl: profileFields.websiteUrl ?? null,
      linkedinUrl: profileFields.linkedinUrl ?? null,
      githubUrl: profileFields.githubUrl ?? null,
      twitterUrl: profileFields.twitterUrl ?? null,
      yearsExperience: profileFields.yearsExperience ?? null,
      skills: skills.map((s) => s.skill),
      workExperiences,
      educations,
      profileStrength: getProfileStrengthSummary(profileFields),
    },
  };
}
