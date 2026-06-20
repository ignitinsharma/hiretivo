"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IndiaStateCombobox } from "@/components/forms/IndiaStateCombobox";
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

const SITUATION_OPTIONS = [
  { value: 'ACTIVELY_LOOKING', label: 'Actively looking' },
  { value: 'OPEN_TO_OFFERS', label: 'Open to offers' },
  { value: 'EXPLORING_OPTIONS', label: 'Exploring options' },
  { value: 'STUDENT_FRESH_GRAD', label: 'Student / Fresh grad' },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATELY', label: 'Immediately' },
  { value: 'TWO_WEEKS', label: '2 weeks notice' },
  { value: 'ONE_MONTH_PLUS', label: '1 month+' },
] as const;

function getSituationLabel(value: string | undefined | null): string {
  if (!value) return 'Not set';
  return SITUATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function getAvailabilityLabel(value: string | undefined | null): string {
  if (!value) return 'Not set';
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function getProfileFormValues(
  profile: SeekerSettingsData | undefined,
): SeekerSettingsInput {
  return {
    name: profile?.name ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    situation: profile?.situation ?? "",
    primaryRole: profile?.primaryRole ?? "",
    salaryMin: profile?.salaryMin ?? null,
    salaryMax: profile?.salaryMax ?? null,
    currency: profile?.currency ?? "",
    availability: profile?.availability ?? "",
    yearsExperience: profile?.yearsExperience ?? null,
  };
}

/*
 * PersonalInfoSection
 * Editable account profile form with a read-only verified email row.
 */
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

  /* Derive Select display values: view mode reads from fetched profile to avoid Radix UI's
   * value-change reconciliation bug (value="" → value="X" after mount doesn't always update
   * the displayed label). Edit mode reads from form state so in-progress edits are reflected. */
  const situationValue = isEditing ? (form.watch('situation') ?? '') : (profile?.situation ?? '');
  const availabilityValue = isEditing ? (form.watch('availability') ?? '') : (profile?.availability ?? '');
  const yearsValue = isEditing
    ? (form.watch('yearsExperience')?.toString() ?? '')
    : (profile?.yearsExperience?.toString() ?? '');

  const handleCancel = (): void => {
    form.reset(getProfileFormValues(profile));
    setIsEditing(false);
  };

  const handleSubmit = async (data: SeekerSettingsInput): Promise<void> => {
    await saveMutation.mutateAsync(data);
    setIsEditing(false);
  };

  return (
    <section id="account" className="bg-white border border-brand-border rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-6 border-b border-brand-border">
        <div>
          <h3 className="text-lg font-bold text-brand-foreground">Personal Information</h3>
          <p className="text-sm text-brand-foreground-muted">
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
              <label className="text-sm font-semibold text-brand-foreground">Full Name</label>
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
              <label className="text-sm font-semibold text-brand-foreground">Email Address</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2">
                  <span className="min-w-0 truncate text-base text-brand-foreground-muted md:text-sm">
                    {profile?.email ?? ""}
                  </span>
                  <span className="shrink-0 rounded-lg bg-brand-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-success">
                    Verified
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Professional Headline</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("headline")} placeholder="e.g. Senior Frontend Developer" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Primary Role</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("primaryRole")} placeholder="e.g. Frontend Developer" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Job Search Status</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select
                  value={situationValue}
                  onValueChange={(val) => form.setValue('situation', val, { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger className="rounded-lg" aria-label="Job search status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Availability</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select
                  value={availabilityValue}
                  onValueChange={(val) => form.setValue('availability', val, { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger className="rounded-lg" aria-label="Availability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">City</label>
              <p className="text-xs text-brand-foreground-muted">
                Recruiters see your city and state to evaluate timezone fit.
              </p>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <Input
                    {...form.register("city")}
                    placeholder="e.g. Bengaluru"
                    disabled={isFormDisabled}
                    aria-invalid={!!form.formState.errors.city}
                  />
                  {form.formState.errors.city && (
                    <p className="text-xs text-red-500">{form.formState.errors.city.message}</p>
                  )}
                </>
              )}
            </div>

            {/* State / UT */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">State / Union Territory</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <IndiaStateCombobox
                    value={form.watch("state") ?? ""}
                    onValueChange={(val) => form.setValue("state", val, { shouldValidate: true })}
                    disabled={isFormDisabled}
                  />
                  {form.formState.errors.city?.message?.includes("together") && (
                    <p className="text-xs text-red-500">Both city and state are required.</p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Years of Experience</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select
                  value={yearsValue}
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
              <label className="text-sm font-semibold text-brand-foreground">Preferred Currency</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("currency")} placeholder="e.g. USD, INR" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Minimum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMin")} placeholder="e.g. 80000" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Maximum Salary</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input type="number" {...form.register("salaryMax")} placeholder="e.g. 120000" disabled={isFormDisabled} />
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-brand-foreground">Bio</label>
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
