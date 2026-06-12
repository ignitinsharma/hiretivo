"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SkillsTagInput } from "@/components/forms/skills-tag-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  seekerService,
  type SeekerSettingsData,
} from "@/services/seeker.service";

interface SkillsSectionProps {
  settings: SeekerSettingsData | undefined;
  isLoading: boolean;
}

export function SkillsSection({ settings, isLoading }: SkillsSectionProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: seekerService.updateSettings,
    onSuccess: async () => {
      toast.success("Skills updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
      setIsEditing(false);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update skills. Try again.",
      ),
  });

  useEffect(() => {
    if (!isEditing) {
      setSkills(settings?.skills.map((skill) => skill.name) ?? []);
    }
  }, [settings?.skills, isEditing]);

  const handleCancel = (): void => {
    setSkills(settings?.skills.map((skill) => skill.name) ?? []);
    setIsEditing(false);
  };

  const handleSave = (): void => {
    if (!settings) {
      toast.error("Failed to update skills. Try again.");
      return;
    }

    mutation.mutate({ skillNames: skills });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Skills</h3>
          <p className="text-sm text-slate-500">
            Keep skills current so matching and recruiter discovery stay accurate.
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={mutation.isPending || isLoading || !settings}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLoading || !settings}
          >
            Edit
          </Button>
        )}
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        ) : (
          <SkillsTagInput
            value={skills}
            onChange={setSkills}
            disabled={!isEditing || mutation.isPending}
            className="w-full"
          />
        )}
      </div>
    </section>
  );
}
