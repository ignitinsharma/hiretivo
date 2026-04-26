"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RecruiterProfileSettingsSchema,
  type RecruiterProfileSettingsInput,
} from "@/lib/validations/interview.schema";
import type { RecruiterSettingsData } from "@/services/recruiter.service";

interface RecruiterProfileSectionProps {
  settings: RecruiterSettingsData;
  onSubmit: (input: RecruiterProfileSettingsInput) => void;
  isSaving: boolean;
}

export function RecruiterProfileSection({
  settings,
  onSubmit,
  isSaving,
}: RecruiterProfileSectionProps) {
  const form = useForm<RecruiterProfileSettingsInput>({
    resolver: zodResolver(RecruiterProfileSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-6"
    >
      <h3 className="mb-5 text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-[#0e0f0c] [font-feature-settings:'calt']">
        Recruiter profile
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Input className="rounded-2xl" placeholder="Name" {...form.register("name")} />
        <Input className="rounded-2xl bg-slate-50" value={settings.email} readOnly />
        <Input className="hidden" {...form.register("companyName")} />
      </div>
      <Button
        type="submit"
        disabled={isSaving}
        className="mt-5 rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
      >
        {isSaving ? "Saving..." : "Save recruiter"}
      </Button>
    </form>
  );
}
