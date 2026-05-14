"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobType, SkillLevel, WorkType } from "@/constants/enums";
import { adminJobCreateSchema, type AdminJobCreateInput } from "@/lib/validations/admin-job.schema";
import {
  useCreateAdminJob,
  useUpdateAdminJob,
  usePublishAdminJob,
} from "../hooks/use-admin-mutations";
import { AdminCompanySection } from "./AdminCompanySection";
import { AdminJobSection } from "./AdminJobSection";
import { AdminJobPreview } from "./AdminJobPreview";
import type { AdminJobDetail, AdminJobFormValues } from "../types/admin-job.types";

interface Props {
  existing?: AdminJobDetail;
}

/*
 * Form-shape schema — accepts string inputs from RHF and validates a minimal subset.
 * The API contract is validated separately via adminJobCreateSchema on submit.
 */
const formSchema = z.object({
  companyName: z.string().trim().min(1, "Company name required").max(100),
  companyLogoUrl: z.string().url().optional().or(z.literal("")),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  companySize: z.string().optional().or(z.literal("")),
  companyIndustry: z.string().optional().or(z.literal("")),
  companyFunding: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(50, "Description must be at least 50 characters"),
  jobType: z.string().min(1, "Job type required"),
  workType: z.string().optional().or(z.literal("")),
  externalApplyUrl: z.string().url("Apply URL required"),
  salaryMin: z.string().optional().or(z.literal("")),
  salaryMax: z.string().optional().or(z.literal("")),
  currency: z.string().optional().or(z.literal("")),
  experienceLevel: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  selectedSkillIds: z.array(z.string()).min(1, "At least one skill required"),
});

/*
 * AdminJobForm
 * Two-column orchestrator for the admin job create/edit page.
 * Left column: form (company section + job section + action bar).
 * Right column: live preview mirroring the seeker-facing job card.
 * Handles draft create/update and publish flow.
 * Reusable for both the create page and the edit page via the `existing` prop.
 *
 * @param existing - Pre-populated AdminJobDetail for edit mode; omit for create mode.
 */
export function AdminJobForm({ existing }: Props) {
  const router = useRouter();
  const isEdit = Boolean(existing);

  const form = useForm<AdminJobFormValues, unknown, AdminJobFormValues>({
    resolver: zodResolver(formSchema) as Resolver<AdminJobFormValues>,
    defaultValues: existing
      ? {
          companyName: existing.companyName ?? "",
          companyLogoUrl: existing.companyLogoUrl ?? "",
          companyWebsite: existing.companyWebsite ?? "",
          companySize: existing.companySize ?? "",
          companyIndustry: existing.companyIndustry ?? "",
          companyFunding: existing.companyFunding ?? "",
          title: existing.title,
          description: existing.description,
          jobType: existing.jobType ?? "",
          workType: existing.workType ?? "",
          externalApplyUrl: existing.externalApplyUrl ?? "",
          salaryMin: existing.salaryMin?.toString() ?? "",
          salaryMax: existing.salaryMax?.toString() ?? "",
          currency: existing.currency ?? "",
          experienceLevel: existing.experienceLevel ?? "",
          category: existing.category ?? "",
          selectedSkillIds: existing.skills.map((s) => s.skillId),
        }
      : {
          companyName: "",
          companyLogoUrl: "",
          companyWebsite: "",
          companySize: "",
          companyIndustry: "",
          companyFunding: "",
          title: "",
          description: "",
          jobType: "",
          workType: "",
          externalApplyUrl: "",
          salaryMin: "",
          salaryMax: "",
          currency: "USD",
          experienceLevel: "",
          category: "",
          selectedSkillIds: [],
        },
  });

  const createMut = useCreateAdminJob();
  const updateMut = useUpdateAdminJob(existing?.id ?? "");
  const publishMut = usePublishAdminJob();

  /*
   * buildPayload
   * Converts AdminJobFormValues (all strings) into an AdminJobCreateInput
   * ready for API submission. Coerces numeric salary strings to integers
   * and maps selectedSkillIds to skill objects with a default INTERMEDIATE level.
   *
   * @param values - Form values from RHF
   * @returns AdminJobCreateInput payload for the API
   */
  const buildPayload = (values: AdminJobFormValues): AdminJobCreateInput => ({
    companyName: values.companyName,
    companyLogoUrl: values.companyLogoUrl || undefined,
    companyWebsite: values.companyWebsite || undefined,
    companySize: (values.companySize || undefined) as AdminJobCreateInput["companySize"],
    companyIndustry: (values.companyIndustry || undefined) as AdminJobCreateInput["companyIndustry"],
    companyFunding: (values.companyFunding || undefined) as AdminJobCreateInput["companyFunding"],
    title: values.title,
    description: values.description,
    jobType: values.jobType as JobType,
    workType: (values.workType || undefined) as WorkType | undefined,
    externalApplyUrl: values.externalApplyUrl,
    salaryMin: values.salaryMin ? parseInt(values.salaryMin, 10) : undefined,
    salaryMax: values.salaryMax ? parseInt(values.salaryMax, 10) : undefined,
    currency: values.currency || undefined,
    experienceLevel: values.experienceLevel || undefined,
    category: values.category || undefined,
    skills: values.selectedSkillIds.map((skillId) => ({
      skillId,
      level: SkillLevel.INTERMEDIATE,
    })),
  });

  /*
   * onSaveDraft
   * Validates the form, builds the API payload, and creates or updates the job
   * as a DRAFT without publishing. On create, redirects to the edit page so
   * subsequent saves are treated as updates.
   */
  const onSaveDraft = form.handleSubmit(async (values) => {
    const payload = buildPayload(values);
    const validated = adminJobCreateSchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    try {
      if (isEdit && existing) {
        await updateMut.mutateAsync(validated.data);
        toast.success("Draft saved");
      } else {
        const result = await createMut.mutateAsync(validated.data);
        toast.success("Draft created");
        router.push(`/admin/jobs/${result.job.id}/edit`);
      }
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Save failed";
      toast.error(msg);
    }
  });

  /*
   * onPublish
   * Validates the form, creates or updates the job if needed, then immediately
   * publishes it (DRAFT → OPEN). Redirects to the admin jobs list on success.
   */
  const onPublish = form.handleSubmit(async (values) => {
    const payload = buildPayload(values);
    const validated = adminJobCreateSchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    try {
      let id = existing?.id;
      if (!id) {
        const result = await createMut.mutateAsync(validated.data);
        id = result.job.id;
      } else {
        await updateMut.mutateAsync(validated.data);
      }
      await publishMut.mutateAsync(id);
      toast.success("Job published");
      router.push("/admin/jobs");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Publish failed";
      toast.error(msg);
    }
  });

  const isPending = createMut.isPending || updateMut.isPending || publishMut.isPending;
  const values = form.watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: form */}
      <form className="space-y-6">
        <AdminCompanySection form={form} />
        <AdminJobSection form={form} />

        {/* Sticky action bar */}
        <div className="flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-4 rounded-xl border border-brand-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            disabled={isPending}
          >
            {isEdit ? "Save draft" : "Create draft"}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onPublish}
            disabled={isPending}
          >
            Publish
          </Button>
        </div>
      </form>

      {/* Right column: live preview */}
      <aside>
        <AdminJobPreview values={values} />
      </aside>
    </div>
  );
}
