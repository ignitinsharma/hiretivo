"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  RecruiterProfileSettingsSchema,
  type RecruiterProfileSettingsInput,
} from "@/lib/validations/interview.schema";
import type { RecruiterSettingsData } from "@/services/recruiter.service";

interface CompanyProfileSectionProps {
  settings: RecruiterSettingsData;
  onSubmit: (input: RecruiterProfileSettingsInput) => void;
  isSaving: boolean;
}

export function CompanyProfileSection({
  settings,
  onSubmit,
  isSaving,
}: CompanyProfileSectionProps) {
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
      <h3 className="mb-5 text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-[#0e0f0c] [font-feature-settings:'calt']">
        Company profile
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Company name" {...form.register("companyName")} />
        <Input placeholder="Website" {...form.register("website")} />
        <Input placeholder="Company size" {...form.register("companySize")} />
        <Input placeholder="Industry" {...form.register("industry")} />
        <Input placeholder="Funding type" {...form.register("fundingType")} />
        <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-foreground">
          Fully remote
          <Switch
            checked={form.watch("isFullyRemote") ?? false}
            onCheckedChange={(checked) => form.setValue("isFullyRemote", checked)}
          />
        </label>
        <Textarea className="md:col-span-2" placeholder="Company bio" {...form.register("bio")} />
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={isSaving}
        className="mt-5"
      >
        {isSaving ? "Saving..." : "Save company"}
      </Button>
    </form>
  );
}
