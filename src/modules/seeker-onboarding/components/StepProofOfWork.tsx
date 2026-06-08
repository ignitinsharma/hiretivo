"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Github, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateSeekerStep3 } from "@/lib/validations/seeker-onboarding.schema";
import type { ProjectEntry } from "@/lib/validations/seeker-onboarding.schema";
import { useSeekerOnboardingStore } from "@/store/use-seeker-onboarding-store";
import { saveProofOfWork } from "@/app/actions/onboarding/seeker";

/*
 * StepProofOfWork
 * Step 3 of seeker onboarding — Proof of Work.
 * Captures GitHub URL (required), optional LinkedIn/portfolio/video links,
 * and at least one project entry (title, URL, description).
 * Save is stubbed — Task 7 will wire the real saveProofOfWork action.
 */
interface StepProofOfWorkProps {
  onNext: () => void;
  onBack: () => void;
}

const EMPTY_PROJECT: ProjectEntry = { title: "", url: "", description: "" };

/*
 * ProjectEntryRow
 * Renders a single project entry with title, URL, description, and remove button.
 */
interface ProjectEntryRowProps {
  project: ProjectEntry;
  index: number;
  onChange: (index: number, updated: ProjectEntry) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

function ProjectEntryRow({
  project,
  index,
  onChange,
  onRemove,
  showRemove,
}: ProjectEntryRowProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-foreground">
          Project {index + 1}
        </span>
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded-lg text-brand-foreground-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
            aria-label="Remove project"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Project title <span className="text-brand-danger">*</span>
        </label>
        <Input
          placeholder="e.g. Open-source CLI tool"
          value={project.title}
          onChange={(e) =>
            onChange(index, { ...project, title: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Project URL <span className="text-brand-danger">*</span>
        </label>
        <Input
          placeholder="https://github.com/you/project"
          value={project.url}
          onChange={(e) =>
            onChange(index, { ...project, url: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-brand-foreground-muted uppercase tracking-wider">
          Description <span className="text-brand-danger">*</span>
        </label>
        <textarea
          placeholder="What did you build and what was your role? (min 20 characters)"
          value={project.description}
          onChange={(e) =>
            onChange(index, { ...project, description: e.target.value })
          }
          rows={3}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
        />
      </div>
    </div>
  );
}

export function StepProofOfWork({ onNext, onBack }: StepProofOfWorkProps) {
  const {
    proofOfWork,
    setGithubUrl,
    setLinkedinUrl,
    setWebsiteUrl,
    setVideoIntroUrl,
    addProject,
    updateProject,
    removeProject,
  } = useSeekerOnboardingStore();

  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  /* Ensure at least one empty project row on first render */
  const projects =
    proofOfWork.projects.length > 0
      ? proofOfWork.projects
      : [{ ...EMPTY_PROJECT }];

  const handleProjectChange = (index: number, updated: ProjectEntry) => {
    if (index < proofOfWork.projects.length) {
      updateProject(index, updated);
    } else {
      addProject(updated);
    }
    setErrors([]);
  };

  const handleAddProject = () => {
    addProject({ ...EMPTY_PROJECT });
  };

  const handleRemoveProject = (index: number) => {
    removeProject(index);
  };

  const handleContinue = async () => {
    if (isSaving) return;

    const projectsToSave =
      proofOfWork.projects.length > 0 ? proofOfWork.projects : projects;

    const validation = validateSeekerStep3({
      githubUrl: proofOfWork.githubUrl,
      linkedinUrl: proofOfWork.linkedinUrl,
      websiteUrl: proofOfWork.websiteUrl,
      videoIntroUrl: proofOfWork.videoIntroUrl,
      projects: projectsToSave,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);

    setIsSaving(true);
    try {
      const result = await saveProofOfWork({
        githubUrl: proofOfWork.githubUrl,
        linkedinUrl: proofOfWork.linkedinUrl!,
        websiteUrl: proofOfWork.websiteUrl!,
        videoIntroUrl: proofOfWork.videoIntroUrl!,
        projects: projectsToSave,
      });

      if (!result.success) {
        setErrors([result.error]);
        return;
      }

      onNext();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 mb-4">
            <Github className="w-6 h-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-foreground">
            Proof of work
          </h2>
          <p className="text-brand-foreground-muted">
            This is what reviewers check first. Strong proof = faster verification.
          </p>
        </div>

        <div className="space-y-5">
          {/* GitHub URL — required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              GitHub profile URL <span className="text-brand-danger">*</span>
            </label>
            <Input
              placeholder="https://github.com/yourusername"
              value={proofOfWork.githubUrl}
              onChange={(e) => {
                setGithubUrl(e.target.value);
                setErrors([]);
              }}
            />
          </div>

          {/* LinkedIn — required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              LinkedIn URL <span className="text-brand-danger">*</span>
            </label>
            <Input
              placeholder="https://linkedin.com/in/yourname"
              value={proofOfWork.linkedinUrl ?? ""}
              onChange={(e) => {
                setLinkedinUrl(e.target.value || null);
                setErrors([]);
              }}
            />
          </div>

          {/* Portfolio — required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Portfolio / Website <span className="text-brand-danger">*</span>
            </label>
            <Input
              placeholder="https://yourwebsite.com"
              value={proofOfWork.websiteUrl ?? ""}
              onChange={(e) => {
                setWebsiteUrl(e.target.value || null);
                setErrors([]);
              }}
            />
          </div>

          {/* Video intro — required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-foreground">
              Short intro video{" "}
              <span className="text-brand-foreground-secondary text-xs font-normal">
                (Loom/YouTube)
              </span>{" "}
              <span className="text-brand-danger">*</span>
            </label>
            <Input
              placeholder="https://loom.com/share/..."
              value={proofOfWork.videoIntroUrl ?? ""}
              onChange={(e) => {
                setVideoIntroUrl(e.target.value || null);
                setErrors([]);
              }}
            />
          </div>

          {/* Projects — required, ≥1 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-brand-foreground">
              Projects <span className="text-brand-danger">*</span>{" "}
              <span className="text-brand-foreground-secondary text-xs font-normal">
                (at least 1 required)
              </span>
            </label>

            <div className="space-y-3">
              {projects.map((project, index) => (
                <ProjectEntryRow
                  key={index}
                  project={project}
                  index={index}
                  onChange={handleProjectChange}
                  onRemove={handleRemoveProject}
                  showRemove={projects.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddProject}
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-brand-primary",
                "hover:text-brand-primary-dk transition-colors",
              )}
            >
              <Plus className="w-4 h-4" />
              Add another project
            </button>
          </div>

          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-brand-danger text-center">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="button"
            onClick={handleContinue}
            variant="primary"
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
  );
}
