"use client";

import { useEffect, useState } from "react";
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
  onSubmit: (input: RecruiterProfileSettingsInput) => Promise<void>;
  isSaving: boolean;
}

export function CompanyProfileSection({
  settings,
  onSubmit,
  isSaving,
}: CompanyProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<RecruiterProfileSettingsInput>({
    resolver: zodResolver(RecruiterProfileSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

  const isFormDisabled = !isEditing || isSaving;

  const handleCancel = (): void => {
    form.reset(settings);
    setIsEditing(false);
  };

  const handleSubmit = async (
    input: RecruiterProfileSettingsInput,
  ): Promise<void> => {
    await onSubmit(input);
    setIsEditing(false);
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-foreground ">
          Company profile
        </h3>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSaving}
              loadingText="Saving..."
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
          >
            Edit
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Company name" {...form.register("companyName")} disabled={isFormDisabled} />
        <Input placeholder="Website" {...form.register("website")} disabled={isFormDisabled} />
        <Input placeholder="Company size" {...form.register("companySize")} disabled={isFormDisabled} />
        <Input placeholder="Industry" {...form.register("industry")} disabled={isFormDisabled} />
        <Input placeholder="Funding type" {...form.register("fundingType")} disabled={isFormDisabled} />
        <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-foreground">
          Fully remote
          <Switch
            checked={form.watch("isFullyRemote") ?? false}
            onCheckedChange={(checked) => form.setValue("isFullyRemote", checked)}
            disabled={isFormDisabled}
          />
        </label>
        <Textarea className="md:col-span-2" placeholder="Company bio" {...form.register("bio")} disabled={isFormDisabled} />
      </div>
    </form>
  );
}
