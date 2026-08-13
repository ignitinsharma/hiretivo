"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PipelineStage } from "@/constants/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createManualApplicationSchema,
  type CreateManualApplicationInput,
} from "@/lib/validations/manual-application";
import { applicationService } from "@/services/application.service";

const STAGE_OPTIONS: { value: PipelineStage; label: string }[] = [
  { value: PipelineStage.NOT_APPLIED, label: "Not Applied Yet" },
  { value: PipelineStage.APPLIED, label: "Applied" },
  { value: PipelineStage.INTERVIEWING, label: "Interviewing" },
  { value: PipelineStage.OFFER, label: "Offer" },
  { value: PipelineStage.REJECTED, label: "Rejected" },
];

/*
 * ManualJobDialog
 * Dialog to manually add a job to the tracker (applied outside Hiretivo).
 * On success it invalidates the applications query so the board refreshes.
 */
export function ManualJobDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateManualApplicationInput>({
    resolver: zodResolver(createManualApplicationSchema),
    defaultValues: {
      title: "",
      companyName: "",
      location: "",
      pipelineStage: PipelineStage.NOT_APPLIED,
    },
  });

  const addJobMutation = useMutation({
    mutationFn: applicationService.addManualJob,
    onSuccess: () => {
      toast.success("Job added to your tracker.");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: () => toast.error("Could not add job. Try again."),
  });

  const handleSubmit = async (data: CreateManualApplicationInput): Promise<void> => {
    await addJobMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Job to Tracker</DialogTitle>
          <DialogDescription>
            Track an application you made outside Hiretivo. Enter the job
            details and the stage you&apos;re at.
          </DialogDescription>
        </DialogHeader>

        <form
          id="manual-job-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="manual-job-title">Job Title</Label>
            <Input
              id="manual-job-title"
              placeholder="e.g. Senior Frontend Developer"
              {...form.register("title")}
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-job-company">Company Name</Label>
            <Input
              id="manual-job-company"
              placeholder="e.g. Acme Inc."
              {...form.register("companyName")}
              aria-invalid={!!form.formState.errors.companyName}
            />
            {form.formState.errors.companyName && (
              <p className="text-xs text-red-500">
                {form.formState.errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-job-location">Location</Label>
            <Input
              id="manual-job-location"
              placeholder="e.g. Remote"
              {...form.register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={form.watch("pipelineStage")}
              onValueChange={(value) =>
                form.setValue("pipelineStage", value as PipelineStage, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger aria-label="Pipeline stage">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.pipelineStage && (
              <p className="text-xs text-red-500">
                {form.formState.errors.pipelineStage.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="manual-job-form"
            variant="primary"
            loading={addJobMutation.isPending}
            loadingText="Adding..."
          >
            Add Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
