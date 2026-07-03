"use client";

import { SettingsSidebar } from "@/modules/seeker/settings/components/SettingsSidebar";
import { SeekerSettingsPanels } from "@/modules/seeker/settings/components/SeekerSettingsPanels";

/*
 * SettingsPage
 * Pivot (app) shell settings page — account, work history, and (from p3c
 * onward) Certifications / Application Defaults / Projects / Self-ID /
 * Optimize-mode. Reuses the same panels as the legacy /seeker/settings page.
 */
export default function SettingsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-brand-foreground">Profile Settings</h1>
        <p className="mt-1 text-brand-foreground-muted">
          Manage your profile details and account security.
        </p>
      </div>

      <div className="flex flex-col gap-10 md:flex-row">
        <SettingsSidebar />
        <SeekerSettingsPanels />
      </div>
    </>
  );
}
