"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { externalApplicationSchema, type ExternalApplicationInput } from "@/lib/validations/external-application";
import { PipelineStage } from "@/constants/enums";
import { applicationService } from "@/services/application.service";

/*
 * LogExternalJobDialog
 * Adds a private job and application to the tracker through POST /log-external.
 */

const STAGE_OPTIONS = [
  { value: PipelineStage.NOT_APPLIED, label: "Not Applied Yet" },
  { value: PipelineStage.APPLIED, label: "Applied" },
  { value: PipelineStage.INTERVIEWING, label: "Interviewing" },
  { value: PipelineStage.OFFER, label: "Offer" },
  { value: PipelineStage.REJECTED, label: "Rejected" },
] as const;

interface LogExternalJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogExternalJobDialog({ open, onOpenChange }: LogExternalJobDialogProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ExternalApplicationInput>({
    resolver: zodResolver(externalApplicationSchema),
    defaultValues: { title: "", companyName: "", location: "", url: "", pipelineStage: PipelineStage.NOT_APPLIED },
  });

  const onSubmit = async (data: ExternalApplicationInput) => {
    setSubmitting(true);
    try {
      await applicationService.logExternalJob(data);
      toast.success("Job added to tracker");
      form.reset();
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to log job";
      const apiMsg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiMsg ?? msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md rounded-xl border border-brand-border bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-brand-foreground">Add job</DialogTitle>
          <DialogDescription className="text-sm text-brand-foreground-muted">
            Track a job you found. Add its URL if you have one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ext-title">Job title *</Label>
            <Input id="ext-title" placeholder="Software Engineer" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-brand-danger">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ext-company">Company *</Label>
            <Input id="ext-company" placeholder="Acme Inc." {...form.register("companyName")} />
            {form.formState.errors.companyName && <p className="text-xs text-brand-danger">{form.formState.errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ext-location">Location</Label>
            <Input id="ext-location" placeholder="San Francisco, CA" {...form.register("location")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ext-url">Job URL</Label>
            <Input id="ext-url" type="url" placeholder="https://example.com/jobs/123" {...form.register("url")} />
            {form.formState.errors.url && <p className="text-xs text-brand-danger">{form.formState.errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Stage *</Label>
            <Select
              value={form.watch("pipelineStage")}
              onValueChange={(v) => form.setValue("pipelineStage", v as PipelineStage, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.pipelineStage && <p className="text-xs text-brand-danger">{form.formState.errors.pipelineStage.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
              {submitting ? "Adding..." : "Add to tracker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
