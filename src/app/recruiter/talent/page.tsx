import { PageHeader } from "@/components/layout/PageHeader";
import { TalentPoolClient } from '@/modules/recruiter/talent/components/TalentPoolClient';

export default function FindTalentPage() {
  return (
    <div className="w-full space-y-8 p-6">
      <PageHeader
        title="Find Talent"
        subtitle="Discover candidates that match your requirements."
      />

      <TalentPoolClient />
    </div>
  );
}
