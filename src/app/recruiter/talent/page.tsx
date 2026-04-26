import { TalentPoolClient } from '@/modules/recruiter/talent/components/TalentPoolClient';

export default function FindTalentPage() {
  return (
    <div className="w-full space-y-8 p-6">
      <div>
        <h1 className="text-[40px] font-black leading-[0.85] text-[#0e0f0c] [font-feature-settings:'calt']">
          Find Talent
        </h1>
        <p className="mt-3 text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] [font-feature-settings:'calt']">
          Discover candidates that match your requirements.
        </p>
      </div>

      <TalentPoolClient />
    </div>
  );
}
