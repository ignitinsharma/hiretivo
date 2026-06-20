import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { PlanTier } from "@/constants/enums";
import type { RecruiterSettingsData } from "@/services/recruiter.service";

/*
 * fetchRecruiterSettingsForPrefetch
 * Direct Prisma query for recruiter settings — used in layout server prefetch.
 * Returns null when profile is missing so the layout can skip hydration.
 * @param userId - Authenticated user id from session
 */
export async function fetchRecruiterSettingsForPrefetch(
  userId: string,
): Promise<{ data: RecruiterSettingsData } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      plan: true,
      billingCustomerId: true,
      accounts: { select: { provider: true } },
      recruiterProfile: {
        select: {
          companyName: true,
          bio: true,
          companySize: true,
          industry: true,
          fundingType: true,
          isFullyRemote: true,
          website: true,
          logo: true,
          emailNotifications: true,
          applicationAlerts: true,
          interviewNotifications: true,
        },
      },
    },
  });

  if (!user?.recruiterProfile) return null;

  const hasGoogleAccount = user.accounts.some((a) => a.provider === "google");
  const isEmailVerified = Boolean(user.emailVerified) || hasGoogleAccount;

  return {
    data: {
      name: user.name ?? "",
      email: user.email ?? "",
      isEmailVerified,
      image: resolveLogoUrl(user.image),
      plan: user.plan as PlanTier,
      billingCustomerId: user.billingCustomerId,
      companyName: user.recruiterProfile.companyName,
      bio: user.recruiterProfile.bio ?? "",
      companySize: user.recruiterProfile.companySize ?? "",
      industry: user.recruiterProfile.industry ?? "",
      fundingType: user.recruiterProfile.fundingType ?? "",
      isFullyRemote: user.recruiterProfile.isFullyRemote,
      website: user.recruiterProfile.website ?? "",
      logo: resolveLogoUrl(user.recruiterProfile.logo),
      emailNotifications: user.recruiterProfile.emailNotifications,
      applicationAlerts: user.recruiterProfile.applicationAlerts,
      interviewNotifications: user.recruiterProfile.interviewNotifications,
    },
  };
}
