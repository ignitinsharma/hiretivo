"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CodingProfilesSchema,
  MAX_CODING_PROFILES,
  type CodingProfileInput,
} from "@/lib/verification/coding-profiles";
import { useSeekerSettingsData } from "@/modules/seeker/settings/components/PersonalInfoSection";
import { seekerService } from "@/services/seeker.service";

function emptyCodingProfile(): CodingProfileInput {
  return {
    platform: "",
    profileUrl: "",
    handle: "",
    evidenceSummary: "",
  };
}

export function CodingProfilesSection() {
  const queryClient = useQueryClient();
  const { data: settingsData, isLoading } = useSeekerSettingsData();
  const profile = settingsData?.data;
  const [profiles, setProfiles] = useState<CodingProfileInput[]>([]);

  useEffect(() => {
    setProfiles(profile?.codingProfiles?.length ? profile.codingProfiles : []);
  }, [profile?.codingProfiles]);

  const saveMutation = useMutation({
    mutationFn: (nextProfiles: CodingProfileInput[]) =>
      seekerService.updateSettings({
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
        codingProfiles: nextProfiles,
      }),
    onSuccess: () => {
      toast.success("Coding profiles updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
    },
    onError: () => toast.error("Failed to save coding profiles. Try again."),
  });

  function updateProfile(index: number, field: keyof CodingProfileInput, value: string) {
    setProfiles((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function addProfile() {
    setProfiles((current) =>
      current.length >= MAX_CODING_PROFILES
        ? current
        : [...current, emptyCodingProfile()],
    );
  }

  function removeProfile(index: number) {
    const next = profiles.filter((_, entryIndex) => entryIndex !== index);
    setProfiles(next);
    saveMutation.mutate(next);
  }

  function saveProfiles() {
    const nonEmptyProfiles = profiles.filter(
      (entry) => entry.platform.trim() || entry.profileUrl.trim(),
    );
    const parsed = CodingProfilesSchema.safeParse(nonEmptyProfiles);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check coding profile links.");
      return;
    }

    saveMutation.mutate(parsed.data);
  }

  const canAdd = profiles.length < MAX_CODING_PROFILES;

  return (
    <section id="coding-profiles" className="rounded-xl border border-brand-border bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border p-6">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-brand-foreground">
            <Code2 className="h-5 w-5 text-brand-primary" aria-hidden="true" />
            Coding Profiles
          </h3>
          <p className="mt-1 text-sm text-brand-foreground-muted">
            Add competitive programming or coding platform evidence for verification.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoading || !profile || !canAdd}
          onClick={addProfile}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {isLoading ? (
          <p className="text-sm text-brand-foreground-muted">Loading...</p>
        ) : null}

        {!isLoading && profiles.length === 0 ? (
          <p className="text-sm text-brand-foreground-muted">
            No coding profiles added yet.
          </p>
        ) : null}

        {profiles.map((entry, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={entry.platform}
                onChange={(event) =>
                  updateProfile(index, "platform", event.target.value)
                }
                placeholder="LeetCode, Codeforces, CodeChef"
                aria-label="Coding platform"
              />
              <Input
                value={entry.profileUrl}
                onChange={(event) =>
                  updateProfile(index, "profileUrl", event.target.value)
                }
                placeholder="https://leetcode.com/u/username"
                aria-label="Coding profile URL"
              />
            </div>
            <Input
              value={entry.handle ?? ""}
              onChange={(event) => updateProfile(index, "handle", event.target.value)}
              placeholder="Handle or username (optional)"
              aria-label="Coding profile handle"
            />
            <Textarea
              value={entry.evidenceSummary ?? ""}
              onChange={(event) =>
                updateProfile(index, "evidenceSummary", event.target.value)
              }
              rows={3}
              placeholder="Optional visible stats, ratings, contest rank, solved count, or notes"
              aria-label="Coding profile evidence summary"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => removeProfile(index)}
              >
                <Trash2 className="h-4 w-4 text-brand-danger" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ))}

        {profiles.length > 0 ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={saveMutation.isPending}
              loadingText="Saving..."
              disabled={!profile || saveMutation.isPending}
              onClick={saveProfiles}
            >
              Save Coding Profiles
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
