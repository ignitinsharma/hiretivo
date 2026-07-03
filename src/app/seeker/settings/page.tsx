'use client';

import React from 'react';
import { SettingsSidebar } from '@/modules/seeker/settings/components/SettingsSidebar';
import { SeekerSettingsPanels } from '@/modules/seeker/settings/components/SeekerSettingsPanels';

/*
 * SeekerSettingsPage
 * Account settings page for seeker profile, social links, work, education, and security.
 */
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
