"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const COMPANY_TYPE_OPTIONS = [
  "SaaS",
  "Fintech",
  "EdTech",
  "Marketplace",
  "Agency",
  "Healthcare",
  "E-commerce",
  "Other",
];

const FUNDING_STAGE_OPTIONS = [
  "Bootstrapped",
  "Pre-seed",
  "Seed funded",
  "Series A",
  "Series B+",
  "Public company",
  "Other",
];

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
        <Input className="hidden" {...form.register("name")} />
        <div className="space-y-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            placeholder="ablespace 121"
            {...form.register("companyName")}
            disabled={isFormDisabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Company website</Label>
          <Input
            id="website"
            placeholder="https://hiretivo.com"
            {...form.register("website")}
            disabled={isFormDisabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize">Company size</Label>
          <Input
            id="companySize"
            placeholder="11-50"
            {...form.register("companySize")}
            disabled={isFormDisabled}
          />
          <p className="text-xs text-brand-foreground-muted">
            Approximate employee count, for example 1-10 or 51-200.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Company type</Label>
          <Select
            value={form.watch("industry") ?? ""}
            onValueChange={(value) =>
              form.setValue("industry", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isFormDisabled}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-brand-foreground-muted">
            Helps seekers understand what kind of business they are joining.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fundingType">Funding stage</Label>
          <Select
            value={form.watch("fundingType") ?? ""}
            onValueChange={(value) =>
              form.setValue("fundingType", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isFormDisabled}
          >
            <SelectTrigger id="fundingType">
              <SelectValue placeholder="Select funding stage" />
            </SelectTrigger>
            <SelectContent>
              {FUNDING_STAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-brand-foreground-muted">
            Funding context is optional; pick the closest match.
          </p>
        </div>
        <label className="flex min-h-10 items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-foreground">
          Fully remote
          <Switch
            checked={form.watch("isFullyRemote") ?? false}
            onCheckedChange={(checked) =>
              form.setValue("isFullyRemote", checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isFormDisabled}
          />
        </label>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Company bio</Label>
          <Textarea
            id="bio"
            placeholder="What does your company do, who do you serve, and why should candidates care?"
            {...form.register("bio")}
            disabled={isFormDisabled}
          />
        </div>
      </div>
    </form>
  );
}
