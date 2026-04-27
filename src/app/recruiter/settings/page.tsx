import { PageHeader } from "@/components/layout/PageHeader";
import { RecruiterSettingsClient } from '@/modules/recruiter/settings/components/RecruiterSettingsClient';

export default function RecruiterSettingsPage() {
  return (
    <div className="w-full space-y-8 p-6">
      <PageHeader
        title="Recruiter Settings"
        subtitle="Manage company profile, recruiter detail, and billing."
      />
      <RecruiterSettingsClient />
    </div>
  );
}
