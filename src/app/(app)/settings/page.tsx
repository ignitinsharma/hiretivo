'use client';

import React from 'react';
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
import { Button } from '@/components/ui/button';

function SettingsPanels() {
  const { data, isLoading } = useSeekerSettingsData();
  const settings = data?.data;

  return (
    <main className="space-y-8 max-w-2xl">
      <PersonalInfoSection />
      <SocialProfilesSection />
      <SkillsSection settings={settings} isLoading={isLoading} />
      <ResumeSection resumeKey={settings?.resumeKey} />
      <PlanBillingSection />
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
    </main>
  );
}

export default function SettingsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-brand-foreground">Settings</h1>
        <p className="text-brand-foreground-muted mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      <SettingsPanels />
    </>
  );
}
