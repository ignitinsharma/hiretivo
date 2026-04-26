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
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (isError || !settings) {
    return (
      <div className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-8 text-center font-semibold text-[#d03238]">
        Recruiter settings could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyAvatarSection companyName={settings.companyName} logo={settings.logo} />
      <RecruiterBillingSection
        plan={settings.plan}
        billingCustomerId={settings.billingCustomerId}
      />
      <RecruiterProfileSection
        settings={settings}
        onSubmit={(input) =>
          saveMutation.mutate({ ...settings, ...input })
        }
        isSaving={saveMutation.isPending}
      />
      <CompanyProfileSection
        settings={settings}
        onSubmit={(input) => saveMutation.mutate(input)}
        isSaving={saveMutation.isPending}
      />
    </div>
  );
}
