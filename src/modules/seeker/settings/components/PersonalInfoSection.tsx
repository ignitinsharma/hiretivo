"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SeekerSettingsSchema,
  type SeekerSettingsInput,
} from "@/lib/validations/seeker.schema";
import { seekerService } from "@/services/seeker.service";
import type { SeekerSettingsData } from "@/services/seeker.service";

export function PersonalInfoSection() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading, isError } = useQuery<{ data: SeekerSettingsData }>({
    queryKey: ["seeker-settings"],
    queryFn: seekerService.getSettings,
    staleTime: 60_000,
  });

  const profile = settingsData?.data;

  const form = useForm<SeekerSettingsInput>({
    resolver: zodResolver(SeekerSettingsSchema),
    defaultValues: {
      name: "", headline: "", bio: "", location: "",
      situation: "", primaryRole: "", salaryMin: null, salaryMax: null,
      currency: "", availability: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        situation: profile.situation ?? "",
        primaryRole: profile.primaryRole ?? "",
        salaryMin: profile.salaryMin ?? null,
        salaryMax: profile.salaryMax ?? null,
        currency: profile.currency ?? "",
        availability: profile.availability ?? "",
      });
    }
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: seekerService.updateSettings,
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
    },
    onError: () => toast.error("Failed to save profile. Try again."),
  });

  return (
    <section id="account" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
        <p className="text-sm text-slate-500">
          Update your profile information that recruiters will see.
        </p>
      </div>

      {isError && (
        <div className="px-6 pt-4">
          <p className="text-sm text-red-500">Failed to load profile data. Please refresh.</p>
        </div>
      )}

      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-[72px] w-[72px] rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xl">
              {profile?.name
                ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                : "??"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <Input {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
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
                <Input {...form.register("headline")} placeholder="e.g. Senior Frontend Developer" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Primary Role</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("primaryRole")} placeholder="e.g. Frontend Developer" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Job Search Status</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("situation")} placeholder="e.g. Actively looking" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Availability</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("availability")} placeholder="e.g. Immediately" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Location</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("location")} placeholder="e.g. San Francisco, CA" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Preferred Currency</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("currency")} placeholder="e.g. USD, INR" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Minimum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMin")} placeholder="e.g. 80000" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Maximum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMax")} placeholder="e.g. 120000" />
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Bio</label>
              {isLoading ? <Skeleton className="h-24 w-full" /> : (
                <Textarea rows={3} {...form.register("bio")} placeholder="Tell recruiters about yourself..." />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-4">
          <Button type="submit" variant="default" size="sm" className="px-5" disabled={saveMutation.isPending || isLoading}>
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
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
