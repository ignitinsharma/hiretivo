"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Briefcase, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateSeekerStep4Experience } from "@/lib/validations/seeker-onboarding.schema";
import type {
  WorkExperienceEntry,
  EducationEntry,
} from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";

/*
 * StepExperience
 * Step 4 of seeker onboarding — Experience & Education.
 * Captures at least one work experience entry (required) and optional education entries.
 * Save is stubbed — Task 7 will wire the real saveExperience action.
 */
interface StepExperienceProps {
  onNext: () => void;
  onBack: () => void;
}

const EMPTY_WORK: WorkExperienceEntry = {
  company: "",
  title: "",
  startDate: "",
  endDate: null,
  isCurrent: false,
  description: null,
};

const EMPTY_EDUCATION: EducationEntry = {
  institution: "",
  degree: null,
  major: null,
  graduationDate: null,
};

/*
 * WorkExperienceRow
 * Renders a single work experience entry with company, title, dates, current checkbox, and description.
 */
interface WorkExperienceRowProps {
  exp: WorkExperienceEntry;
  index: number;
  onChange: (index: number, updated: WorkExperienceEntry) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

function WorkExperienceRow({
  exp,
  index,
  onChange,
  onRemove,
  showRemove,
}: WorkExperienceRowProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-foreground">
          Experience {index + 1}
        </span>
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded-lg text-brand-foreground-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
            aria-label="Remove experience"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            Company <span className="text-brand-danger">*</span>
          </label>
          <Input
            placeholder="e.g. Acme Corp"
            value={exp.company}
            onChange={(e) => onChange(index, { ...exp, company: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            Job title <span className="text-brand-danger">*</span>
          </label>
          <Input
            placeholder="e.g. Senior Engineer"
            value={exp.title}
            onChange={(e) => onChange(index, { ...exp, title: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            Start date <span className="text-brand-danger">*</span>
          </label>
          <Input
            placeholder="MM/YYYY"
            value={exp.startDate}
            onChange={(e) => onChange(index, { ...exp, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            End date
          </label>
          <Input
            placeholder="MM/YYYY"
            value={exp.endDate ?? ""}
            disabled={exp.isCurrent}
            onChange={(e) =>
              onChange(index, { ...exp, endDate: e.target.value || null })
            }
            className={cn(exp.isCurrent && "opacity-50 cursor-not-allowed")}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={exp.isCurrent}
          onChange={(e) =>
            onChange(index, {
              ...exp,
              isCurrent: e.target.checked,
              endDate: e.target.checked ? null : exp.endDate,
            })
          }
          className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/20"
        />
        <span className="text-sm text-brand-foreground">
          I currently work here
        </span>
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Description{" "}
          <span className="text-brand-foreground-secondary text-xs font-normal normal-case">
            (optional)
          </span>
        </label>
        <textarea
          placeholder="What did you build/achieve?"
          value={exp.description ?? ""}
          onChange={(e) =>
            onChange(index, { ...exp, description: e.target.value || null })
          }
          rows={2}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
        />
      </div>
    </div>
  );
}

/*
 * EducationRow
 * Renders a single education entry with institution, degree, major, and graduation date.
 */
interface EducationRowProps {
  edu: EducationEntry;
  index: number;
  onChange: (index: number, updated: EducationEntry) => void;
  onRemove: (index: number) => void;
}

function EducationRow({ edu, index, onChange, onRemove }: EducationRowProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-foreground">
          Education {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 rounded-lg text-brand-foreground-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
          aria-label="Remove education"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Institution <span className="text-brand-danger">*</span>
        </label>
        <Input
          placeholder="e.g. IIT Bombay"
          value={edu.institution}
          onChange={(e) => onChange(index, { ...edu, institution: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            Degree
          </label>
          <Input
            placeholder="e.g. B.Tech"
            value={edu.degree ?? ""}
            onChange={(e) =>
              onChange(index, { ...edu, degree: e.target.value || null })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
            Major
          </label>
          <Input
            placeholder="e.g. Computer Science"
            value={edu.major ?? ""}
            onChange={(e) =>
              onChange(index, { ...edu, major: e.target.value || null })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Graduation date
        </label>
        <Input
          placeholder="MM/YYYY"
          value={edu.graduationDate ?? ""}
          onChange={(e) =>
            onChange(index, { ...edu, graduationDate: e.target.value || null })
          }
        />
      </div>
    </div>
  );
}

export function StepExperience({ onNext, onBack }: StepExperienceProps) {
  const {
    experience,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [showEducation, setShowEducation] = useState(
    experience.educations.length > 0
  );

  const workExperiences =
    experience.workExperiences.length > 0
      ? experience.workExperiences
      : [{ ...EMPTY_WORK }];

  const handleWorkChange = (index: number, updated: WorkExperienceEntry) => {
    if (index < experience.workExperiences.length) {
      updateWorkExperience(index, updated);
    } else {
      addWorkExperience(updated);
    }
    setErrors([]);
  };

  const handleAddWork = () => {
    addWorkExperience({ ...EMPTY_WORK });
  };

  const handleEduChange = (index: number, updated: EducationEntry) => {
    if (index < experience.educations.length) {
      updateEducation(index, updated);
    } else {
      addEducation(updated);
    }
  };

  const handleAddEducation = () => {
    if (!showEducation) {
      setShowEducation(true);
      addEducation({ ...EMPTY_EDUCATION });
    } else {
      addEducation({ ...EMPTY_EDUCATION });
    }
  };

  const handleContinue = async () => {
    const validation = validateSeekerStep4Experience({
      workExperiences:
        experience.workExperiences.length > 0
          ? experience.workExperiences
          : workExperiences,
      educations: experience.educations,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    // TODO: wire to saveExperience in task 7
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 mb-4">
            <Briefcase className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            Experience &amp; education
          </h2>
          <p className="text-brand-foreground-muted">
            Real work experience builds reviewer trust.
          </p>
        </div>

        <div className="space-y-5">
          {/* Work experience */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-brand-foreground">
              Work experience <span className="text-brand-danger">*</span>
            </label>

            <div className="space-y-3">
              {workExperiences.map((exp, index) => (
                <WorkExperienceRow
                  key={index}
                  exp={exp}
                  index={index}
                  onChange={handleWorkChange}
                  onRemove={removeWorkExperience}
                  showRemove={workExperiences.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddWork}
              className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dk transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add experience
            </button>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-brand-foreground">
              Education{" "}
              <span className="text-brand-foreground-secondary text-xs font-normal">
                (optional)
              </span>
            </label>

            {showEducation && experience.educations.length > 0 && (
              <div className="space-y-3">
                {experience.educations.map((edu, index) => (
                  <EducationRow
                    key={index}
                    edu={edu}
                    index={index}
                    onChange={handleEduChange}
                    onRemove={removeEducation}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddEducation}
              className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dk transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add education
            </button>
          </div>

          {errors.length > 0 && (
            <p className="text-sm text-brand-danger text-center">
              {errors[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            onClick={handleContinue}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
