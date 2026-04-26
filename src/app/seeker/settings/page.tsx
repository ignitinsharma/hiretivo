import React from 'react';
import { SettingsSidebar } from '@/modules/seeker/settings/components/SettingsSidebar';
import { PersonalInfoSection } from '@/modules/seeker/settings/components/PersonalInfoSection';
import { PasswordSecuritySection } from '@/modules/seeker/settings/components/PasswordSecuritySection';

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
        
        <main className="flex-1 space-y-8">
          <PersonalInfoSection />
          <PasswordSecuritySection />
        </main>
      </div>
    </>
  );
}
