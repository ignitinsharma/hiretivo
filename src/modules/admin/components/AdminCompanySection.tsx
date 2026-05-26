"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyAutocomplete } from "./CompanyAutocomplete";
import { LogoPreview } from "./LogoPreview";
import {
  ADMIN_COMPANY_SIZE_OPTIONS,
  ADMIN_COMPANY_INDUSTRY_OPTIONS,
  ADMIN_COMPANY_FUNDING_OPTIONS,
} from "@/lib/validations/admin-job.schema";
import type { AdminJobFormValues, CompanySuggestion } from "../types/admin-job.types";

interface Props {
  form: UseFormReturn<AdminJobFormValues>;
}

/*
 * AdminCompanySection
 * Company sub-form rendered inside the admin job create/edit form.
 * Includes autocomplete to reuse previously-entered companies and
 * a live logo preview that gracefully falls back on broken URLs.
 * Populates companyName, companyLogoUrl, companyWebsite, companySize,
 * companyIndustry, and companyFunding fields.
 */
export function AdminCompanySection({ form }: Props) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedName = watch("companyName");
  const watchedLogo = watch("companyLogoUrl");

  /*
   * handleSuggestionSelect
   * Auto-fills all company fields when the user picks an autocomplete suggestion.
   * Triggers validation on companyName so required-field feedback is immediate.
   */
  const handleSuggestionSelect = (c: CompanySuggestion) => {
    setValue("companyName", c.companyName, { shouldValidate: true });
    setValue("companyLogoUrl", c.companyLogoUrl ?? "");
    setValue("companyWebsite", c.companyWebsite ?? "");
    setValue("companySize", c.companySize ?? "");
    setValue("companyIndustry", c.companyIndustry ?? "");
    setValue("companyFunding", c.companyFunding ?? "");
  };

  return (
    <div className="space-y-4 rounded-xl border border-brand-border bg-white p-6">
      <h2 className="font-semibold text-xl text-brand-foreground">Company</h2>

      {/* Company name — uses autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Company name *</Label>
        <Controller
          name="companyName"
          control={control}
          render={({ field }) => (
            <CompanyAutocomplete
              value={field.value}
              onChange={field.onChange}
              onSelect={handleSuggestionSelect}
            />
          )}
        />
        {errors.companyName && (
          <p className="text-xs text-brand-danger">{errors.companyName.message}</p>
        )}
      </div>

      {/* Logo URL with live preview */}
      <div className="space-y-2">
        <Label htmlFor="companyLogoUrl">Logo URL</Label>
        <div className="flex items-center gap-3">
          <LogoPreview url={watchedLogo ?? ""} companyName={watchedName ?? "?"} size={48} />
          <Input
            id="companyLogoUrl"
            placeholder="https://example.com/logo.png"
            {...register("companyLogoUrl")}
          />
        </div>
        {errors.companyLogoUrl && (
          <p className="text-xs text-brand-danger">{errors.companyLogoUrl.message}</p>
        )}
        {watchedLogo?.startsWith("http://") && (
          <p className="text-xs text-brand-foreground-muted">
            Use HTTPS to avoid mixed-content blocking.
          </p>
        )}
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="companyWebsite">Website</Label>
        <Input
          id="companyWebsite"
          placeholder="https://company.com"
          {...register("companyWebsite")}
        />
      </div>

      {/* Size + Industry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Size</Label>
          <Controller
            name="companySize"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_COMPANY_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Industry</Label>
          <Controller
            name="companyIndustry"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_COMPANY_INDUSTRY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Funding stage */}
      <div className="space-y-2">
        <Label>Funding (optional)</Label>
        <Controller
          name="companyFunding"
          control={control}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select funding stage" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_COMPANY_FUNDING_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}
