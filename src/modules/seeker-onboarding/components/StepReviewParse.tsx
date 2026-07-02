"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillsTagInput } from "@/components/forms/skills-tag-input";
import { ProgressiveStep } from "@/constants/enums";
import {
  ParsedResumeSchema,
  type ParsedResumeDraft,
} from "@/lib/validations/resume-parse.schema";
import { saveParsedProfile } from "@/app/actions/onboarding/seeker";
import { useProgressiveOnboardingStore } from "@/store/use-progressive-onboarding-store";

const FIELD_LABEL_CLASS = "text-xs font-medium text-brand-foreground-muted uppercase tracking-wider";

/* Empty draft used as the RHF default when there's nothing to review (manual-fill path). */
const EMPTY_DRAFT: ParsedResumeDraft = ParsedResumeSchema.parse({});

/*
 * WorkExperienceRow
 * A single editable work-experience row within the review form's field array.
 */
interface WorkExperienceRowProps {
  index: number;
  onRemove: () => void;
  showRemove: boolean;
  register: ReturnType<typeof useForm<ParsedResumeDraft>>["register"];
}

function WorkExperienceRow({ index, onRemove, showRemove, register }: WorkExperienceRowProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-foreground">Experience {index + 1}</span>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove experience"
            className="p-1 rounded-lg text-brand-foreground-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Company</label>
          <Input placeholder="e.g. Acme Corp" {...register(`workExperiences.${index}.company`)} />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Job title</label>
          <Input placeholder="e.g. Senior Engineer" {...register(`workExperiences.${index}.title`)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Start date</label>
          <Input placeholder="e.g. Jan 2021" {...register(`workExperiences.${index}.startDate`)} />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>End date</label>
          <Input placeholder="e.g. Present" {...register(`workExperiences.${index}.endDate`)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL_CLASS}>Description</label>
        <textarea
          {...register(`workExperiences.${index}.description`)}
          rows={2}
          className="max-h-48 min-h-20 w-full resize-none overflow-y-auto rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
    </div>
  );
}

/*
 * EducationRow
 * A single editable education row within the review form's field array.
 */
interface EducationRowProps {
  index: number;
  onRemove: () => void;
  showRemove: boolean;
  register: ReturnType<typeof useForm<ParsedResumeDraft>>["register"];
}

function EducationRow({ index, onRemove, showRemove, register }: EducationRowProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-foreground">Education {index + 1}</span>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove education"
            className="p-1 rounded-lg text-brand-foreground-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL_CLASS}>Institution</label>
        <Input placeholder="e.g. Stanford University" {...register(`educations.${index}.institution`)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Degree</label>
          <Input placeholder="e.g. B.S." {...register(`educations.${index}.degree`)} />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Major</label>
          <Input placeholder="e.g. Computer Science" {...register(`educations.${index}.major`)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FIELD_LABEL_CLASS}>Graduation date</label>
        <Input placeholder="e.g. May 2020" {...register(`educations.${index}.graduationDate`)} />
      </div>
    </div>
  );
}

/*
 * StepReviewParse
 * Review/correct step of the progressive onboarding flow — the trust boundary
 * for AI-extracted resume data (honesty brand: nothing is persisted until the
 * seeker confirms it). Renders the same form empty when `isManualFallback` is
 * true (image PDF or user chose "fill manually"). On submit, calls
 * `saveParsedProfile` and redirects to the dashboard — no verification wall.
 */
export function StepReviewParse() {
  const router = useRouter();
  const { draft, resumeKey, isManualFallback, setStep } = useProgressiveOnboardingStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ParsedResumeDraft>({
    resolver: zodResolver(ParsedResumeSchema) as unknown as Resolver<ParsedResumeDraft>,
    defaultValues: draft ?? EMPTY_DRAFT,
  });

  const workFieldArray = useFieldArray({ control, name: "workExperiences" });
  const educationFieldArray = useFieldArray({ control, name: "educations" });

  // Empty-state guard: nothing to review and not an explicit manual-fill entry — bounce to upload.
  useEffect(() => {
    if (!draft && !isManualFallback) {
      setStep(ProgressiveStep.UPLOAD);
    }
  }, [draft, isManualFallback, setStep]);

  const onSubmit = async (values: ParsedResumeDraft) => {
    setServerError(null);
    const result = await saveParsedProfile({ draft: values, resumeKey });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.push("/seeker/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 mb-2">
            <User className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="font-semibold text-xl leading-snug tracking-tight text-brand-foreground">
            Review your profile
          </h2>
          <p className="text-brand-foreground-muted">
            {isManualFallback
              ? "We couldn't extract text from your resume — fill in your details below."
              : "We never fabricate — double-check every field before it's saved."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={FIELD_LABEL_CLASS}>Full name</label>
            <Input placeholder="e.g. Jane Doe" {...register("fullName")} />
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL_CLASS}>Headline</label>
            <Input placeholder="e.g. Senior Backend Engineer" {...register("headline")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={FIELD_LABEL_CLASS}>Primary role</label>
            <Input placeholder="e.g. Backend Engineer" {...register("primaryRole")} />
          </div>
          <div className="space-y-1.5">
            <label className={FIELD_LABEL_CLASS}>Location</label>
            <Input placeholder="e.g. Berlin, Germany" {...register("location")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Bio</label>
          <textarea
            {...register("bio")}
            rows={3}
            className="max-h-48 min-h-20 w-full resize-none overflow-y-auto rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className={FIELD_LABEL_CLASS}>Skills</label>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <SkillsTagInput value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-brand-foreground">Work experience</label>
          <div className="space-y-3">
            {workFieldArray.fields.map((field, index) => (
              <WorkExperienceRow
                key={field.id}
                index={index}
                register={register}
                onRemove={() => workFieldArray.remove(index)}
                showRemove={workFieldArray.fields.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              workFieldArray.append({
                company: "",
                title: "",
                startDate: "",
                endDate: null,
                isCurrent: false,
                description: null,
              })
            }
            className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dk transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add experience
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-brand-foreground">Education</label>
          <div className="space-y-3">
            {educationFieldArray.fields.map((field, index) => (
              <EducationRow
                key={field.id}
                index={index}
                register={register}
                onRemove={() => educationFieldArray.remove(index)}
                showRemove={educationFieldArray.fields.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              educationFieldArray.append({
                institution: "",
                degree: null,
                major: null,
                graduationDate: null,
              })
            }
            className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dk transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add education
          </button>
        </div>

        {serverError && <p className="text-sm text-brand-danger text-center">{serverError}</p>}

        <Button
          type="submit"
          size="lg"
          variant="primary"
          className="w-full"
          loading={isSubmitting}
          loadingText="Saving…"
        >
          Save and browse jobs
        </Button>
      </div>
    </form>
  );
}
