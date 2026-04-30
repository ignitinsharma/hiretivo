"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SeekerSettingsSchema,
  type SeekerSettingsInput,
} from "@/lib/validations/seeker.schema";
import { seekerService } from "@/services/seeker.service";
import type { SeekerSettingsData } from "@/services/seeker.service";

const YEARS_OPTIONS = [
  { value: '0', label: '< 1 Year' },
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '4', label: '4 Years' },
  { value: '5', label: '5 Years' },
  { value: '6', label: '6 Years' },
  { value: '7', label: '7 Years' },
  { value: '8', label: '8 Years' },
  { value: '9', label: '9 Years' },
  { value: '10', label: '10+ Years' },
] as const;

function getProfileFormValues(
  profile: SeekerSettingsData | undefined,
): SeekerSettingsInput {
  return {
    name: profile?.name ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    situation: profile?.situation ?? "",
    primaryRole: profile?.primaryRole ?? "",
    salaryMin: profile?.salaryMin ?? null,
    salaryMax: profile?.salaryMax ?? null,
    currency: profile?.currency ?? "",
    availability: profile?.availability ?? "",
    yearsExperience: profile?.yearsExperience ?? null,
  };
}

export function PersonalInfoSection() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settingsData, isLoading, isError } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });

  const profile = settingsData?.data;

  const form = useForm<SeekerSettingsInput>({
    resolver: zodResolver(SeekerSettingsSchema),
    defaultValues: getProfileFormValues(undefined),
  });

  useEffect(() => {
    form.reset(getProfileFormValues(profile));
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: seekerService.updateSettings,
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
    },
    onError: () => toast.error("Failed to save profile. Try again."),
  });

  const isFormDisabled = !isEditing || saveMutation.isPending;

  const handleCancel = (): void => {
    form.reset(getProfileFormValues(profile));
    setIsEditing(false);
  };

  const handleSubmit = async (data: SeekerSettingsInput): Promise<void> => {
    await saveMutation.mutateAsync(data);
    setIsEditing(false);
  };

  return (
    <section id="account" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
          <p className="text-sm text-slate-500">
            Update your profile information that recruiters will see.
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCancel}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="personal-info-form"
              variant="primary"
              size="sm"
              loading={saveMutation.isPending}
              loadingText="Saving..."
              disabled={isLoading || !profile}
            >
              Save
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLoading || !profile}
          >
            Edit
          </Button>
        )}
      </div>

      {isError && (
        <div className="px-6 pt-4">
          <p className="text-sm text-red-500">Failed to load profile data. Please refresh.</p>
        </div>
      )}

      <form id="personal-info-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <Input {...form.register("name")} aria-invalid={!!form.formState.errors.name} disabled={isFormDisabled} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <div className="relative">
                  <Input value={profile?.email ?? ""} readOnly className="bg-slate-50 text-slate-500 pr-24" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-black bg-gray-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Professional Headline</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("headline")} placeholder="e.g. Senior Frontend Developer" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Primary Role</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("primaryRole")} placeholder="e.g. Frontend Developer" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Job Search Status</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("situation")} placeholder="e.g. Actively looking" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Availability</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("availability")} placeholder="e.g. Immediately" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Location</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("location")} placeholder="e.g. San Francisco, CA" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select
                  value={form.watch('yearsExperience')?.toString() ?? ''}
                  onValueChange={(val) => form.setValue('yearsExperience', val === '' ? null : Number(val))}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger className="rounded-lg" aria-label="Years of experience">
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Preferred Currency</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("currency")} placeholder="e.g. USD, INR" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Minimum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMin")} placeholder="e.g. 80000" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Maximum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMax")} placeholder="e.g. 120000" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Bio</label>
              {isLoading ? <Skeleton className="h-24 w-full" /> : (
                <Textarea rows={3} {...form.register("bio")} placeholder="Tell recruiters about yourself..." disabled={isFormDisabled} />
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}

export function useSeekerSettingsData() {
  return useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });
}
