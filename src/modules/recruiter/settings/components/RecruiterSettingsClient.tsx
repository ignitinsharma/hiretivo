"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import type { RecruiterProfileSettingsInput } from "@/lib/validations/interview.schema";
import { recruiterService } from "@/services/recruiter.service";

import { CompanyAvatarSection } from "./CompanyAvatarSection";
import { CompanyProfileSection } from "./CompanyProfileSection";
import { RecruiterBillingSection } from "./RecruiterBillingSection";
import { RecruiterProfileSection } from "./RecruiterProfileSection";

interface SettingsSectionSkeletonProps {
  fieldCount: number;
}

function SettingsSectionSkeleton({ fieldCount }: SettingsSectionSkeletonProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: fieldCount }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecruiterSettingsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recruiter-settings"],
    queryFn: recruiterService.getSettings,
    staleTime: 60_000,
  });
  const settings = data?.data;

  const saveMutation = useMutation({
    mutationFn: (input: RecruiterProfileSettingsInput) =>
      recruiterService.updateSettings(input),
    onSuccess: async () => {
      toast.success("Settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["recruiter-settings"] });
    },
    onError: () => toast.error("Failed to save settings. Try again."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SettingsSectionSkeleton fieldCount={2} />
        <SettingsSectionSkeleton fieldCount={2} />
        <SettingsSectionSkeleton fieldCount={4} />
        <SettingsSectionSkeleton fieldCount={4} />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center font-semibold text-[#d03238]">
        Recruiter settings could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyAvatarSection
        companyName={settings.companyName}
        logo={settings.logo}
      />
      <RecruiterBillingSection
        plan={settings.plan}
        billingCustomerId={settings.billingCustomerId}
      />
      <RecruiterProfileSection
        settings={settings}
        onSubmit={async (input) => {
          await saveMutation.mutateAsync({ ...settings, ...input });
        }}
        isSaving={saveMutation.isPending}
      />
      <CompanyProfileSection
        settings={settings}
        onSubmit={async (input) => {
          await saveMutation.mutateAsync(input);
        }}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
