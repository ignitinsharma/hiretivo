'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import {
  PersonalInfoSection,
  useSeekerSettingsData,
} from '@/modules/seeker/settings/components/PersonalInfoSection';
import { PasswordSecuritySection } from '@/modules/seeker/settings/components/PasswordSecuritySection';
import { SkillsSection } from '@/modules/seeker/settings/components/SkillsSection';
import { ResumeSection } from '@/modules/seeker/settings/components/ResumeSection';
import { SocialProfilesSection } from '@/modules/seeker/settings/components/SocialProfilesSection';
import { PlanBillingSection } from '@/modules/seeker/settings/components/PlanBillingSection';
import { SettingsSidebar, type SettingsTab } from '@/modules/seeker/settings/components/SettingsSidebar';
import { Button } from '@/components/ui/button';
import { SELF_HOSTED } from '@/lib/config';

/*
 * SettingsContent
 * Renders the active settings section based on the selected sidebar tab.
 * Only one section renders at a time.
 */
function SettingsContent({ activeTab }: { activeTab: SettingsTab }) {
  const { data, isLoading } = useSeekerSettingsData();
  const settings = data?.data;

  switch (activeTab) {
    case 'personal':
      return <PersonalInfoSection />;
    case 'social':
      return <SocialProfilesSection />;
    case 'skills':
      return <SkillsSection settings={settings} isLoading={isLoading} />;
    case 'resume':
      return <ResumeSection resumeKey={settings?.resumeKey} />;
    case 'billing':
      return SELF_HOSTED ? null : <PlanBillingSection />;
    case 'password':
      return (
        <div className="space-y-8">
          <PasswordSecuritySection />
          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h3 className="text-lg font-bold text-brand-foreground">Account</h3>
            <p className="text-sm text-brand-foreground-muted mt-1 mb-4">
              Sign out of your account on this device.
            </p>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </section>
        </div>
      );
  }
}

/*
 * SettingsPage
 * Two-column SaaS dashboard settings layout:
 * Left — sticky sidebar with section navigation
 * Right — active section content, filling available width
 * Mobile — horizontal pill tabs above content
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-foreground">Settings</h1>
        <p className="text-brand-foreground-muted mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 min-w-0">
          <SettingsContent activeTab={activeTab} />
        </div>
      </div>
    </>
  );
}
