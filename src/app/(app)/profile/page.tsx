"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { ProfileHeader } from "@/modules/seeker/profile/components/ProfileHeader";
import { DocumentsSection } from "@/modules/seeker/profile/components/DocumentsSection";
import { getProfileCompleteness } from "@/modules/seeker/profile/utils/profile-completeness";

/*
 * ProfilePage
 * Read-only seeker profile view: header + completeness ring plus section
 * cards (Documents, Experience, Education, Skills, Certifications, Projects,
 * Application Defaults — added across later p3c tasks).
 */
export default function ProfilePage() {
  const { data, isLoading, isError, refetch } = useSeekerSettingsData();
  const verification = useVerificationStatus();
  const profile = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-6 text-center">
        <p className="text-sm text-brand-foreground-muted">Failed to load your profile.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-brand-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const completeness = getProfileCompleteness({
    hasBasics: Boolean(profile.name && profile.headline),
    hasResume: Boolean(profile.resumeKey),
    hasExperience: profile.workExperiences.length > 0,
    hasEducation: profile.educations.length > 0,
    hasSkills: profile.skills.length > 0,
    hasApplicationDefaults: false, // wired in Task 8 once application-defaults query lands
  });

  return (
    <div className="space-y-6">
      <ProfileHeader
        name={profile.name}
        headline={profile.headline}
        image={profile.image}
        completeness={completeness}
        verified={verification.isVerified}
      />
      <DocumentsSection resumeKey={profile.resumeKey} />
    </div>
  );
}
