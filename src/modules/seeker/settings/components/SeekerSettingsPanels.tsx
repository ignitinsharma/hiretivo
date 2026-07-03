"use client";

import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { PersonalInfoSection } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { PasswordSecuritySection } from "@/modules/seeker/settings/components/PasswordSecuritySection";
import { SkillsSection } from "@/modules/seeker/settings/components/SkillsSection";
import { ResumeSection } from "@/modules/seeker/settings/components/ResumeSection";
import { AvatarSection } from "@/modules/seeker/settings/components/AvatarSection";
import { SocialProfilesSection } from "@/modules/seeker/settings/components/SocialProfilesSection";
import { WorkExperienceSection } from "@/modules/seeker/settings/components/WorkExperienceSection";
import { EducationSection } from "@/modules/seeker/settings/components/EducationSection";
import { CertificationsSection } from "@/modules/seeker/settings/components/CertificationsSection";
import { ApplicationDefaultsSection } from "@/modules/seeker/settings/components/ApplicationDefaultsSection";
import { useVerificationStatus } from "@/hooks/use-verification-status";

/*
 * SeekerSettingsPanels
 * Renders the editable seeker settings sections once profile data is available.
 * Shared by the legacy `/seeker/settings` page and the pivot `(app)/settings`
 * page — extracted here (2+ rule) so both stay in sync.
 */
export function SeekerSettingsPanels() {
  const { data, isLoading } = useSeekerSettingsData();
  const hiretivo = useVerificationStatus();
  const settings = data?.data;

  return (
    <main className="flex-1 space-y-8">
      <AvatarSection
        name={settings?.name}
        image={settings?.image}
        headline={settings?.headline}
        primaryRole={settings?.primaryRole}
        profileStrength={settings?.profileStrength}
        verified={hiretivo.isVerified}
      />
      <PersonalInfoSection />
      <SocialProfilesSection />
      <SkillsSection settings={settings} isLoading={isLoading} />
      <WorkExperienceSection />
      <EducationSection />
      <CertificationsSection />
      <ApplicationDefaultsSection />
      <ResumeSection resumeKey={settings?.resumeKey} />
      <PasswordSecuritySection />
    </main>
  );
}
