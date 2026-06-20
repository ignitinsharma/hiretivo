"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Linkedin, Github, Twitter } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { seekerService } from "@/services/seeker.service";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";

/** Zod schema for the social profiles sub-form. */
const SocialProfilesFormSchema = z.object({
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  linkedinUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  githubUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  twitterUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
});

type SocialProfilesFormInput = z.infer<typeof SocialProfilesFormSchema>;

type SocialFieldName = keyof SocialProfilesFormInput;

interface SocialFieldConfig {
  name: SocialFieldName;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}

/** Static config for social profile fields — rendered via .map(), no repetition. */
const SOCIAL_FIELDS: SocialFieldConfig[] = [
  {
    name: "websiteUrl",
    label: "Website",
    icon: Globe,
    placeholder: "https://yoursite.com",
  },
  {
    name: "linkedinUrl",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/username",
  },
  {
    name: "githubUrl",
    label: "GitHub",
    icon: Github,
    placeholder: "https://github.com/username",
  },
  {
    name: "twitterUrl",
    label: "Twitter / X",
    icon: Twitter,
    placeholder: "https://x.com/username",
  },
];

/**
 * SocialProfilesSection — settings card for managing a seeker's social/web links.
 * Follows the same edit/save/cancel pattern as PersonalInfoSection.
 * Re-uses the shared `useSeekerSettingsData` query so both sections share the
 * same cache entry and a save in either section keeps the other in sync.
 */
export function SocialProfilesSection() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settingsData, isLoading, isError } = useSeekerSettingsData();
  const profile = settingsData?.data;

  const form = useForm<SocialProfilesFormInput>({
    resolver: zodResolver(SocialProfilesFormSchema),
    defaultValues: {
      websiteUrl: "",
      linkedinUrl: "",
      githubUrl: "",
      twitterUrl: "",
    },
  });

  useEffect(() => {
    form.reset({
      websiteUrl: profile?.websiteUrl ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      twitterUrl: profile?.twitterUrl ?? "",
    });
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: (data: SocialProfilesFormInput) =>
      seekerService.updateSettings({
        websiteUrl: data.websiteUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        twitterUrl: data.twitterUrl || null,
      }),
    onSuccess: () => {
      toast.success("Social profiles updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      setIsEditing(false);
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const handleCancel = (): void => {
    form.reset({
      websiteUrl: profile?.websiteUrl ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      twitterUrl: profile?.twitterUrl ?? "",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (data: SocialProfilesFormInput): Promise<void> => {
    await saveMutation.mutateAsync(data);
  };

  const isFormDisabled = !isEditing || saveMutation.isPending;

  return (
    <section
      id="social"
      className="overflow-hidden rounded-xl border border-brand-border bg-white"
    >
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 border-b border-brand-border-light p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Social Profiles</h3>
          <p className="text-sm text-slate-500">
            Add links to your online presence.
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
              form="social-profiles-form"
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
          <p className="text-sm text-red-500">
            Failed to load profile data. Please refresh.
          </p>
        </div>
      )}

      <form
        id="social-profiles-form"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          {SOCIAL_FIELDS.map(({ name, label, icon: Icon, placeholder }) => (
            <div key={name} className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </label>

              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <Input
                    {...form.register(name)}
                    placeholder={placeholder}
                    disabled={isFormDisabled}
                    aria-invalid={!!form.formState.errors[name]}
                  />
                  {form.formState.errors[name] && (
                    <p className="text-xs text-red-500" role="alert">
                      {form.formState.errors[name]?.message}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </form>
    </section>
  );
}
