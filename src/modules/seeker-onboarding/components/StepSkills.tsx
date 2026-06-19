"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Construction,
  Plus,
  X,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  validateSeekerStep2,
  YEARS_OPTIONS,
} from "@/lib/validations/seeker-onboarding.schema";
import type { YearsOfExperience } from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { useFieldErrors } from "@/modules/seeker-onboarding/hooks/use-field-errors";
import { saveStep2 } from "@/app/actions/onboarding/seeker";
import { skillService } from "@/services/skill.service";
import type { SkillItem } from "@/services/skill.service";

const SKILLS_MATCH_TIP =
  "Add the skills you want to be matched for. We use them to personalize your job feed.";
const FIELD_ERROR_CLASS = "text-sm text-brand-danger";

interface StepSkillsProps {
  onNext: () => void;
  onBack: () => void;
}

/*
 * StepSkills
 * Renders the seeker onboarding role, experience, and skills step.
 * Saves selected skills as intermediate-level profile skills before continuing.
 */
export function StepSkills({ onNext, onBack }: StepSkillsProps) {
  const { step2, setPrimaryRole, setYearsOfExperience, setSkills } =
    useSeekerOnboardingStore();

  const fe = useFieldErrors();
  const { revalidate } = fe;
  const [serverError, setServerError] = useState<string | null>(null);
  const [apiSkills, setApiSkills] = useState<SkillItem[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    skillService
      .getSkills()
      .then((data) => setApiSkills(data))
      .catch(() => {})
      .finally(() => setSkillsLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowSkillDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recompute the live field-error map whenever any step 2 value changes.
  useEffect(() => {
    revalidate(
      validateSeekerStep2({
        primaryRole: step2.primaryRole,
        yearsOfExperience: step2.yearsOfExperience ?? undefined,
        skills: step2.skills,
      }).fieldErrors,
    );
  }, [step2.primaryRole, step2.yearsOfExperience, step2.skills, revalidate]);

  const handleContinue = async () => {
    if (isSaving) return;
    setServerError(null);
    const validation = validateSeekerStep2({
      primaryRole: step2.primaryRole,
      yearsOfExperience: step2.yearsOfExperience ?? undefined,
      skills: step2.skills,
    });

    if (!validation.valid) {
      fe.setSubmitted(validation.fieldErrors);
      return;
    }

    setIsSaving(true);
    const result = await saveStep2({
      primaryRole: step2.primaryRole,
      yearsOfExperience: step2.yearsOfExperience,
      skills: step2.skills,
    });
    setIsSaving(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    onNext();
  };

  const addSkill = (skillName: string) => {
    if (!step2.skills.includes(skillName)) {
      setSkills([...step2.skills, skillName]);
    }
    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (skillName: string) => {
    setSkills(step2.skills.filter((s) => s !== skillName));
  };

  const createSkill = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsCreatingSkill(true);
    try {
      const slug = trimmed
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      try {
        const newSkill = await skillService.createSkill({
          name: trimmed,
          slug,
          category: "Other",
        });
        setApiSkills((prev) => [...prev, newSkill]);
        addSkill(newSkill.name);
      } catch (error) {
        const existing = apiSkills.find(
          (s) => s.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (existing) {
          addSkill(existing.name);
          return;
        }
        throw error;
      }
    } catch (err) {
      console.error("[StepSkills] Failed to create skill:", err);
    } finally {
      setIsCreatingSkill(false);
    }
  };

  const filteredSkills = apiSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const noMatch =
    showSkillDropdown &&
    skillSearch &&
    filteredSkills.length === 0 &&
    !skillsLoading;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Construction className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            What are your top skills?
          </h2>
          <p className="text-muted-foreground">
            Recruiters search the talent pool by exact skills.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Primary role
              </label>
              <Input
                placeholder="e.g. Frontend Developer"
                value={step2.primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                onBlur={() => fe.touch("primaryRole")}
                aria-invalid={fe.hasError("primaryRole")}
              />
              {fe.errorFor("primaryRole") && (
                <p className={FIELD_ERROR_CLASS}>{fe.errorFor("primaryRole")}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Years of experience
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {YEARS_OPTIONS.map((option) => {
                  const isSelected = step2.yearsOfExperience === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setYearsOfExperience(option.value as YearsOfExperience)
                      }
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all text-sm font-medium",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {fe.errorFor("yearsOfExperience") && (
                <p className={FIELD_ERROR_CLASS}>
                  {fe.errorFor("yearsOfExperience")}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Top skills <span className="text-red-500">*</span>
                </label>
                <p className="text-sm leading-relaxed text-brand-foreground-muted">
                  <span className="font-medium text-brand-foreground">Tip:</span>{" "}
                  {SKILLS_MATCH_TIP}
                </p>
              </div>

              {step2.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {step2.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-primary/20"
                    >
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                        onClick={() => removeSkill(skill)}
                      />
                    </span>
                  ))}
                </div>
              )}

              <div className="relative" ref={dropdownRef}>
                <Input
                  placeholder={
                    skillsLoading
                      ? "Loading skills..."
                      : "Search or add skills..."
                  }
                  className="pr-10"
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(e.target.value);
                    setShowSkillDropdown(true);
                  }}
                  onFocus={() => setShowSkillDropdown(true)}
                  disabled={skillsLoading}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      skillSearch.trim() &&
                      !skillsLoading
                    ) {
                      e.preventDefault();
                      const existing = filteredSkills.find(
                        (s) =>
                          s.name.toLowerCase() ===
                          skillSearch.trim().toLowerCase(),
                      );
                      if (existing) {
                        addSkill(existing.name);
                      } else {
                        createSkill(skillSearch.trim());
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>

                {showSkillDropdown &&
                  skillSearch &&
                  filteredSkills.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredSkills
                        .filter(
                          (s) =>
                            !step2.skills.some(
                              (ss) => ss.toLowerCase() === s.name.toLowerCase(),
                            ),
                        )
                        .slice(0, 10)
                        .map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                            onClick={() => addSkill(skill.name)}
                          >
                            {skill.name}{" "}
                            <span className="text-slate-400 text-xs">
                              ({skill.category})
                            </span>
                          </button>
                        ))}
                    </div>
                  )}

                {noMatch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-primary/5 text-sm text-primary font-medium transition-colors"
                      onClick={() => createSkill(skillSearch.trim())}
                      disabled={isCreatingSkill}
                    >
                      <Plus className="w-4 h-4" />
                      {isCreatingSkill
                        ? `Creating "${skillSearch}"...`
                        : `Create "${skillSearch}" as new skill`}
                    </button>
                  </div>
                )}
              </div>
              {fe.errorFor("skills") && (
                <p className={FIELD_ERROR_CLASS}>{fe.errorFor("skills")}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive text-center">
                {serverError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleContinue}
              variant={"primary"}
              size="lg"
              className="w-full"
              loading={isSaving}
              loadingText="Saving..."
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
    </div>
  );
}
