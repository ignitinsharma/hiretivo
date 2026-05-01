'use client';

import React from 'react';
import { SettingsSidebar } from '@/modules/seeker/settings/components/SettingsSidebar';
import {
  PersonalInfoSection,
  useSeekerSettingsData,
} from '@/modules/seeker/settings/components/PersonalInfoSection';
import { PasswordSecuritySection } from '@/modules/seeker/settings/components/PasswordSecuritySection';
import { SkillsSection } from '@/modules/seeker/settings/components/SkillsSection';
import { ResumeSection } from '@/modules/seeker/settings/components/ResumeSection';
import { AvatarSection } from '@/modules/seeker/settings/components/AvatarSection';
import { SocialProfilesSection } from '@/modules/seeker/settings/components/SocialProfilesSection';
import { WorkExperienceSection } from '@/modules/seeker/settings/components/WorkExperienceSection';
import { EducationSection } from '@/modules/seeker/settings/components/EducationSection';

function SeekerSettingsPanels() {
  const { data, isLoading } = useSeekerSettingsData();
  const settings = data?.data;

  return (
    <main className="flex-1 space-y-8">
      <AvatarSection name={settings?.name} image={settings?.image} />
      <PersonalInfoSection />
      <SocialProfilesSection />
      <SkillsSection settings={settings} isLoading={isLoading} />
      <WorkExperienceSection />
      <EducationSection />
      <ResumeSection resumeKey={settings?.resumeKey} />
      <PasswordSecuritySection />
    </main>
  );
}

export default function SeekerSettingsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your profile details and account security.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        <SettingsSidebar />
        <SeekerSettingsPanels />
      </div>
    </>
  );
}
