'use client';

import React from 'react';
import { toast } from 'sonner';
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

interface PrivacyDataSectionProps {
  email?: string | null;
}

/*
 * PrivacyDataSection
 * Provides GDPR/DPDP account deletion request and data export controls.
 */
function PrivacyDataSection({ email }: PrivacyDataSectionProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const deletionSubject = encodeURIComponent(
    `Delete account: ${email ?? 'Hiretivo user'}`,
  );
  const deletionBody = encodeURIComponent(
    'Please delete my account and all associated data. I understand Hiretivo will process this request within 30 days and send a confirmation email.',
  );

  async function handleDataExport() {
    setIsExporting(true);

    try {
      const response = await fetch('/api/engineer/data-export');
      if (!response.ok) {
        toast.error('Export failed. Please try again.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hiretivo-data-export.json';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data export downloaded.');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section
      id="privacy"
      className="rounded-xl border border-brand-border bg-white p-6"
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-brand-foreground">
          Privacy & Data
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
          We will process deletion requests within 30 days and send a
          confirmation email.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleDataExport}
          disabled={isExporting}
          className="rounded-lg border border-brand-border bg-white px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? 'Downloading...' : 'Download My Data'}
        </button>
        <a
          href={`mailto:admin@hiretivo.com?subject=${deletionSubject}&body=${deletionBody}`}
          className="rounded-lg border border-brand-danger bg-white px-5 py-2.5 text-center text-sm font-medium text-brand-danger transition-colors hover:bg-red-50"
        >
          Request Account Deletion
        </a>
      </div>
    </section>
  );
}

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
      <PrivacyDataSection email={settings?.email} />
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
