import { UserRole, VerificationStatus } from "@/constants/enums";
import type { Prisma } from "@prisma/client";

/*
 * TalentQueryFilters
 * Input filters accepted by buildTalentQuery.
 * All fields are optional — omitted fields produce no filter clause.
 * @field q           - Full-text search spanning name, email, headline, primaryRole, bio,
 *                      location, availability, work experiences, educations, and skills.
 * @field skill       - Filter by skill name (case-insensitive substring match).
 * @field location    - Filter by seeker profile location (case-insensitive substring match).
 * @field availability - Filter by seeker profile availability (case-insensitive substring match).
 */
export interface TalentQueryFilters {
  q?: string;
  skill?: string;
  location?: string;
  availability?: string;
}

/*
 * buildTalentQuery
 * Builds the Prisma UserWhereInput for the paid-path talent pool query.
 * Constrains results to SEEKER role with VERIFIED status and a linked seekerProfile.
 * Applies optional filters for location, availability, and skill on the seekerProfile.
 * When q is provided, adds an OR clause spanning: name, email, headline, primaryRole,
 * bio, location, availability, workExperiences (company/title/description),
 * educations (institution/degree/major), and skills.
 * @param filters - Optional filter fields from TalentQueryFilters.
 * @returns Prisma.UserWhereInput ready for use in prisma.user.findMany / prisma.user.count.
 */
export function buildTalentQuery(filters: TalentQueryFilters): Prisma.UserWhereInput {
  const { q = "", skill = "", location = "", availability = "" } = filters;

  return {
    role: UserRole.SEEKER,
    verificationStatus: VerificationStatus.VERIFIED,
    seekerProfile: {
      is: {
        ...(location
          ? { location: { contains: location, mode: "insensitive" } }
          : {}),
        ...(availability
          ? { availability: { contains: availability, mode: "insensitive" } }
          : {}),
        ...(skill
          ? {
              skills: {
                some: {
                  skill: { name: { contains: skill, mode: "insensitive" } },
                },
              },
            }
          : {}),
      },
    },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            {
              seekerProfile: {
                is: {
                  OR: [
                    { headline: { contains: q, mode: "insensitive" } },
                    { primaryRole: { contains: q, mode: "insensitive" } },
                    { bio: { contains: q, mode: "insensitive" } },
                    { location: { contains: q, mode: "insensitive" } },
                    { availability: { contains: q, mode: "insensitive" } },
                    {
                      workExperiences: {
                        some: {
                          OR: [
                            { company: { contains: q, mode: "insensitive" } },
                            { title: { contains: q, mode: "insensitive" } },
                            { description: { contains: q, mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                    {
                      educations: {
                        some: {
                          OR: [
                            { institution: { contains: q, mode: "insensitive" } },
                            { degree: { contains: q, mode: "insensitive" } },
                            { major: { contains: q, mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                    {
                      skills: {
                        some: {
                          skill: { name: { contains: q, mode: "insensitive" } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
}
