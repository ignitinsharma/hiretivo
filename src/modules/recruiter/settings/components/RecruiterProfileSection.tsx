"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  RecruiterProfileSettingsSchema,
  type RecruiterProfileSettingsInput,
} from "@/lib/validations/interview.schema";
import type { RecruiterSettingsData } from "@/services/recruiter.service";

interface RecruiterProfileSectionProps {
  settings: RecruiterSettingsData;
  onSubmit: (input: RecruiterProfileSettingsInput) => Promise<void>;
  isSaving: boolean;
}

export function RecruiterProfileSection({
  settings,
  onSubmit,
  isSaving,
}: RecruiterProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<RecruiterProfileSettingsInput>({
    resolver: zodResolver(RecruiterProfileSettingsSchema),
    defaultValues: settings,
  });
  const isEmailVerified = settings.isEmailVerified;

  useEffect(() => {
    form.reset(settings);
  }, [form, settings]);

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
      className="rounded-xl border border-brand-border bg-white p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-foreground ">
            Recruiter profile
          </h3>
          <p
            className={cn(
              "mt-1 flex items-center gap-1.5 text-sm font-semibold",
              isEmailVerified ? "text-brand-success" : "text-brand-danger",
            )}
          >
            {isEmailVerified ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {isEmailVerified ? "Email verified" : "Email not verified"}
          </p>
        </div>
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
        <Input placeholder="Name" {...form.register("name")} disabled={!isEditing || isSaving} />
        <Input className="bg-slate-50" value={settings.email} readOnly />
        <Input className="hidden" {...form.register("companyName")} />
      </div>
    </form>
  );
}
