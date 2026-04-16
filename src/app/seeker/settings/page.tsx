import { SettingsSidebar } from '@/modules/seeker/settings/components/SettingsSidebar';
import { PersonalInfoSection } from '@/modules/seeker/settings/components/PersonalInfoSection';
import { PasswordSecuritySection } from '@/modules/seeker/settings/components/PasswordSecuritySection';
import { DangerZoneSection } from '@/modules/seeker/settings/components/DangerZoneSection';

export default function SeekerSettingsPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your personal information and security preferences.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-10">
        <SettingsSidebar />
        <main className="flex-1 space-y-8">
          <PersonalInfoSection />
          <PasswordSecuritySection />
          <DangerZoneSection />
        </main>
      </div>
    </>
  );
}
