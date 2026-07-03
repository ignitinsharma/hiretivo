"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { ProfileHeader } from "@/modules/seeker/profile/components/ProfileHeader";
import { DocumentsSection } from "@/modules/seeker/profile/components/DocumentsSection";
import { ExperienceSection } from "@/modules/seeker/profile/components/ExperienceSection";
import { EducationSection } from "@/modules/seeker/profile/components/EducationSection";
import { SkillsSection } from "@/modules/seeker/profile/components/SkillsSection";
import { CertificationsSection } from "@/modules/seeker/profile/components/CertificationsSection";
import { ProjectsSection } from "@/modules/seeker/profile/components/ProjectsSection";
import { ApplicationDefaultsSection } from "@/modules/seeker/profile/components/ApplicationDefaultsSection";
import { getProfileCompleteness } from "@/modules/seeker/profile/utils/profile-completeness";
import { seekerService } from "@/services/seeker.service";
import type { CertificationItem } from "@/services/seeker.service";
import type { ApplicationDefaultsInput } from "@/lib/validations/application-defaults.schema";
import type { ProjectInput } from "@/lib/validations/project.schema";

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

  const { data: certificationsData } = useQuery<{ data: { certifications: CertificationItem[] } }>({
    queryKey: ["seeker-certifications"],
    queryFn: seekerService.getCertifications,
    staleTime: 60_000,
  });
  const certifications = certificationsData?.data.certifications ?? [];

  const { data: applicationDefaultsData } = useQuery<{ data: ApplicationDefaultsInput | null }>({
    queryKey: ["seeker-application-defaults"],
    queryFn: seekerService.getApplicationDefaults,
    staleTime: 60_000,
  });
  const applicationDefaults = applicationDefaultsData?.data ?? null;

  const { data: projectsData } = useQuery<{ data: { projects: ProjectInput[] } }>({
    queryKey: ["seeker-projects"],
    queryFn: seekerService.getProjects,
    staleTime: 60_000,
  });
  const projects = projectsData?.data.projects ?? [];

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
    hasApplicationDefaults: Boolean(applicationDefaults?.phone && applicationDefaults?.workAuth),
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
      <ExperienceSection items={profile.workExperiences} />
      <EducationSection items={profile.educations} />
      <SkillsSection skills={profile.skills} />
      <CertificationsSection items={certifications} />
      <ProjectsSection items={projects} />
      <ApplicationDefaultsSection defaults={applicationDefaults} />
    </div>
  );
}
