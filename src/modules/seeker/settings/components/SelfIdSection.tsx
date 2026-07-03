"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  SelfIdSchema,
  type SelfIdInput,
} from "@/lib/validations/application-defaults.schema";
import type { ApplicationDefaultsInput } from "@/lib/validations/application-defaults.schema";
import { SelfIdGender, SelfIdAnswer, SELF_ID_GENDER_VALUES, SELF_ID_ANSWER_VALUES } from "@/constants/enums";
import { seekerService } from "@/services/seeker.service";

const GENDER_LABELS: Record<SelfIdGender, string> = {
  [SelfIdGender.MALE]: "Male",
  [SelfIdGender.FEMALE]: "Female",
  [SelfIdGender.NONBINARY]: "Non-binary",
  [SelfIdGender.PREFER_NOT]: "Prefer not to say",
};

const ANSWER_LABELS: Record<SelfIdAnswer, string> = {
  [SelfIdAnswer.YES]: "Yes",
  [SelfIdAnswer.NO]: "No",
  [SelfIdAnswer.PREFER_NOT]: "Prefer not to say",
};

function isUsCountry(countryCode: string | null | undefined): boolean {
  return (countryCode ?? "").trim().toUpperCase() === "US";
}

function getFormValues(data: ApplicationDefaultsInput | null | undefined): SelfIdInput {
  return {
    selfIdGender: data?.selfIdGender ?? SelfIdGender.PREFER_NOT,
    selfIdEthnicity: data?.selfIdEthnicity ?? "",
    veteranStatus: data?.veteranStatus ?? SelfIdAnswer.PREFER_NOT,
    disabilityStatus: data?.disabilityStatus ?? SelfIdAnswer.PREFER_NOT,
  };
}

/*
 * SelfIdSection
 * Voluntary US-EEO self-identification form. Renders only when the seeker's
 * Application Defaults country is US — hidden entirely otherwise. Every
 * field defaults to "Prefer not to say" and never blocks saving.
 */
export function SelfIdSection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: ApplicationDefaultsInput | null }>({
    queryKey: ["seeker-application-defaults"],
    queryFn: seekerService.getApplicationDefaults,
    staleTime: 60_000,
  });
  const defaults = data?.data ?? null;

  const form = useForm<SelfIdInput>({
    resolver: zodResolver(SelfIdSchema),
    values: getFormValues(defaults),
  });

  const saveMutation = useMutation({
    mutationFn: (values: SelfIdInput) =>
      seekerService.updateApplicationDefaults({ ...(defaults ?? getFormValues(null)), ...values }),
    onSuccess: () => {
      toast.success("Self-identification updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-application-defaults"] });
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  if (isLoading || !isUsCountry(defaults?.countryCode)) {
    return null;
  }

  return (
    <section id="self-id" className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">Voluntary Self-Identification</h3>
        <p className="text-sm text-brand-foreground-muted">
          Shown only for US roles. Voluntary — &quot;Prefer not to say&quot; is always available and never affects your application.
        </p>
      </div>

      <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">Gender</label>
            <Select
              value={form.watch("selfIdGender") ?? SelfIdGender.PREFER_NOT}
              onValueChange={(val) => form.setValue("selfIdGender", val as SelfIdGender)}
            >
              <SelectTrigger className="rounded-lg" aria-label="Gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELF_ID_GENDER_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>{GENDER_LABELS[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">Ethnicity</label>
            <Input {...form.register("selfIdEthnicity")} placeholder="Prefer not to say" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">Veteran Status</label>
            <Select
              value={form.watch("veteranStatus") ?? SelfIdAnswer.PREFER_NOT}
              onValueChange={(val) => form.setValue("veteranStatus", val as SelfIdAnswer)}
            >
              <SelectTrigger className="rounded-lg" aria-label="Veteran status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELF_ID_ANSWER_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>{ANSWER_LABELS[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-foreground">Disability Status</label>
            <Select
              value={form.watch("disabilityStatus") ?? SelfIdAnswer.PREFER_NOT}
              onValueChange={(val) => form.setValue("disabilityStatus", val as SelfIdAnswer)}
            >
              <SelectTrigger className="rounded-lg" aria-label="Disability status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELF_ID_ANSWER_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>{ANSWER_LABELS[v]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
}
