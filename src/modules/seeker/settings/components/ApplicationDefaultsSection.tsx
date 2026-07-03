"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ApplicationDefaultsSchema,
  type ApplicationDefaultsInput,
} from "@/lib/validations/application-defaults.schema";
import { WorkAuthStatus, WORK_AUTH_STATUS_VALUES } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";

const WORK_AUTH_LABELS: Record<WorkAuthStatus, string> = {
  [WorkAuthStatus.CITIZEN]: "Citizen",
  [WorkAuthStatus.PERMANENT_RESIDENT]: "Permanent resident",
  [WorkAuthStatus.WORK_VISA]: "Work visa",
  [WorkAuthStatus.NEEDS_SPONSORSHIP]: "Needs sponsorship",
  [WorkAuthStatus.STUDENT]: "Student",
  [WorkAuthStatus.OTHER]: "Other",
};

function getFormValues(data: ApplicationDefaultsInput | null | undefined): ApplicationDefaultsInput {
  return {
    addressLine: data?.addressLine ?? "",
    city: data?.city ?? "",
    state: data?.state ?? "",
    postalCode: data?.postalCode ?? "",
    countryCode: data?.countryCode ?? "",
    phone: data?.phone ?? "",
    linkedinUrl: data?.linkedinUrl ?? "",
    workAuth: data?.workAuth ?? null,
    authorizedCountry: data?.authorizedCountry ?? "",
    needsSponsorship: data?.needsSponsorship ?? false,
    openToOnsite: data?.openToOnsite ?? false,
    willingRelocate: data?.willingRelocate ?? false,
    startImmediately: data?.startImmediately ?? false,
    additionalNotes: data?.additionalNotes ?? "",
  };
}

/*
 * ApplicationDefaultsSection
 * Settings edit form for the ATS-form-fill payload — contact, location,
 * global work authorization, and preferences. Onboarding (Phase 1c) defers
 * these fields until first apply; this is where the seeker completes them.
 */
export function ApplicationDefaultsSection() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError } = useQuery<{ data: ApplicationDefaultsInput | null }>({
    queryKey: ["seeker-application-defaults"],
    queryFn: seekerService.getApplicationDefaults,
    staleTime: 60_000,
  });
  const defaults = data?.data ?? null;

  const form = useForm<ApplicationDefaultsInput>({
    resolver: zodResolver(ApplicationDefaultsSchema),
    defaultValues: getFormValues(undefined),
  });

  useEffect(() => {
    form.reset(getFormValues(defaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: seekerService.updateApplicationDefaults,
    onSuccess: () => {
      toast.success("Application defaults updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-application-defaults"] });
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const isFormDisabled = !isEditing || saveMutation.isPending;
  const workAuthValue = isEditing ? (form.watch("workAuth") ?? "") : (defaults?.workAuth ?? "");

  const handleCancel = (): void => {
    form.reset(getFormValues(defaults));
    setIsEditing(false);
  };

  const handleSubmit = async (data: ApplicationDefaultsInput): Promise<void> => {
    await saveMutation.mutateAsync(data);
    setIsEditing(false);
  };

  return (
    <section id="application-defaults" className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border p-6">
        <div>
          <h3 className="text-lg font-bold text-brand-foreground">Application Defaults</h3>
          <p className="text-sm text-brand-foreground-muted">
            Contact, location, and work authorization used to pre-fill job applications.
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="default" size="sm" onClick={handleCancel} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="application-defaults-form"
              variant="primary"
              size="sm"
              loading={saveMutation.isPending}
              loadingText="Saving..."
              disabled={isLoading}
            >
              Save
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isLoading}>
            Edit
          </Button>
        )}
      </div>

      {isError && (
        <div className="px-6 pt-4">
          <p className="text-sm text-red-500">Failed to load application defaults. Please refresh.</p>
        </div>
      )}

      <form id="application-defaults-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Phone</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("phone")} placeholder="+1 415 555 0100" disabled={isFormDisabled} />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">LinkedIn URL</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <Input {...form.register("linkedinUrl")} placeholder="https://linkedin.com/in/you" disabled={isFormDisabled} aria-invalid={!!form.formState.errors.linkedinUrl} />
                  {form.formState.errors.linkedinUrl && <p className="text-xs text-red-500">{form.formState.errors.linkedinUrl.message}</p>}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Address Line</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("addressLine")} placeholder="123 Main St" disabled={isFormDisabled} />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">City</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("city")} placeholder="Berlin" disabled={isFormDisabled} />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">State / Region</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("state")} placeholder="Berlin" disabled={isFormDisabled} />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Postal Code</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("postalCode")} placeholder="10115" disabled={isFormDisabled} />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Country Code (ISO-2)</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <>
                  <Input {...form.register("countryCode")} placeholder="DE" maxLength={2} disabled={isFormDisabled} aria-invalid={!!form.formState.errors.countryCode} />
                  {form.formState.errors.countryCode && <p className="text-xs text-red-500">{form.formState.errors.countryCode.message}</p>}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Work Authorization</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Select
                  value={workAuthValue}
                  onValueChange={(val) => form.setValue("workAuth", val === "" ? null : (val as WorkAuthStatus), { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger className="rounded-lg" aria-label="Work authorization">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_AUTH_STATUS_VALUES.map((status) => (
                      <SelectItem key={status} value={status}>{WORK_AUTH_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-foreground">Authorized Country</label>
              {isLoading ? <Skeleton className="h-10 w-full" /> : (
                <Input {...form.register("authorizedCountry")} placeholder="Germany" disabled={isFormDisabled} />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-foreground">Preferences</p>
            {isLoading ? <Skeleton className="h-24 w-full" /> : (
              <div className="space-y-3">
                {([
                  ["needsSponsorship", "I need visa sponsorship"],
                  ["openToOnsite", "Open to onsite roles"],
                  ["willingRelocate", "Willing to relocate"],
                  ["startImmediately", "Available to start immediately"],
                ] as const).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-3 text-sm text-brand-foreground">
                    <Checkbox
                      checked={form.watch(field) ?? false}
                      onCheckedChange={(checked) => form.setValue(field, checked === true)}
                      disabled={isFormDisabled}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">Additional Notes</label>
            {isLoading ? <Skeleton className="h-24 w-full" /> : (
              <Textarea rows={3} {...form.register("additionalNotes")} placeholder="Anything else recruiters should know..." disabled={isFormDisabled} />
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
