import { prisma } from "@/lib/prisma";
import { parseLegacyLocation } from "@/modules/india-location/helpers";
import type { SeekerSettingsData } from "@/services/seeker.service";

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
      seekerProfile: {
        select: {
          phone: true,
          headline: true,
          bio: true,
          location: true,
          resumeKey: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          twitterUrl: true,
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

  const { seekerProfile, ...userFields } = user;
  const { skills, ...profileFields } = seekerProfile;

  const { city, state: derivedState } = parseLegacyLocation(
    profileFields.location,
  );

  return {
    data: {
      name: userFields.name ?? "",
      email: userFields.email ?? "",
      phone: profileFields.phone ?? "",
      headline: profileFields.headline ?? "",
      bio: profileFields.bio ?? "",
      location: profileFields.location ?? null,
      city,
      state: derivedState,
      resumeKey: profileFields.resumeKey ?? null,
      websiteUrl: profileFields.websiteUrl ?? null,
      linkedinUrl: profileFields.linkedinUrl ?? null,
      githubUrl: profileFields.githubUrl ?? null,
      twitterUrl: profileFields.twitterUrl ?? null,
      skills: skills.map((s) => s.skill),
    },
  };
}
