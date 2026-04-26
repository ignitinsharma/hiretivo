"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/axios";
import { seekerService, type SeekerSettingsData } from "@/services/seeker.service";

interface SkillOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface SkillsSectionProps {
  settings: SeekerSettingsData | undefined;
  isLoading: boolean;
}

async function fetchSkills(): Promise<SkillOption[]> {
  const { data } = await apiClient.get<SkillOption[]>("/skills");
  return data;
}

export function SkillsSection({ settings, isLoading }: SkillsSectionProps) {
  const queryClient = useQueryClient();
  const { data: skills = [], isLoading: isSkillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
    staleTime: 5 * 60_000,
  });

  const selectedIds = new Set(settings?.skills.map((skill) => skill.id) ?? []);
  const mutation = useMutation({
    mutationFn: seekerService.updateSettings,
    onSuccess: async () => {
      toast.success("Skills updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
    },
    onError: () => toast.error("Failed to update skills. Try again."),
  });

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["skills"] });
  }, [queryClient]);

  const toggleSkill = (skillId: string): void => {
    if (!settings) return;
    const next = new Set(selectedIds);
    if (next.has(skillId)) {
      next.delete(skillId);
    } else {
      next.add(skillId);
    }
    mutation.mutate({
      name: settings.name,
      headline: settings.headline ?? "",
      bio: settings.bio ?? "",
      location: settings.location ?? "",
      situation: settings.situation ?? "",
      primaryRole: settings.primaryRole ?? "",
      salaryMin: settings.salaryMin,
      salaryMax: settings.salaryMax,
      currency: settings.currency ?? "",
      availability: settings.availability ?? "",
      skillIds: Array.from(next),
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">Skills</h3>
        <p className="text-sm text-slate-500">
          Keep skills current so matching and recruiter discovery stay accurate.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-6">
        {isLoading || isSkillsLoading ? (
          <>
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </>
        ) : (
          skills.map((skill) => {
            const active = selectedIds.has(skill.id);
            return (
              <Button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                variant={active ? "default" : "outline"}
                className="rounded-full transition-transform hover:scale-105 active:scale-95"
                disabled={mutation.isPending}
              >
                {skill.name}
              </Button>
            );
          })
        )}
      </div>
    </section>
  );
}
