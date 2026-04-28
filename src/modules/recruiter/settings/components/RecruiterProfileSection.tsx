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
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h3 className="mb-5 text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-foreground ">
        Recruiter profile
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Name" {...form.register("name")} />
        <Input className="bg-slate-50" value={settings.email} readOnly />
        <Input className="hidden" {...form.register("companyName")} />
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={isSaving}
        className="mt-5"
      >
        {isSaving ? "Saving..." : "Save recruiter"}
      </Button>
    </form>
  );
}
