"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { VerificationProject } from "@/modules/verification/components/VerificationFlow";

interface StepBioProjectsProps {
  legalName: string;
  bio: string;
  topProjects: VerificationProject[];
  onChangeName: (value: string) => void;
  onChangeBio: (value: string) => void;
  onChangeProjects: (projects: VerificationProject[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function StepBioProjects({
  legalName,
  bio,
  topProjects,
  onChangeName,
  onChangeBio,
  onChangeProjects,
  onNext,
  onBack,
}: StepBioProjectsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const wordCount = getWordCount(bio);

  function updateProject(
    index: number,
    field: keyof VerificationProject,
    value: string,
  ) {
    onChangeProjects(
      topProjects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project,
      ),
    );
  }

  function addProject() {
    if (topProjects.length >= 3) return;
    onChangeProjects([...topProjects, { name: "", description: "", url: "" }]);
  }

  function removeProject(index: number) {
    if (topProjects.length === 1) return;
    onChangeProjects(topProjects.filter((_, projectIndex) => projectIndex !== index));
  }

  function validateAndContinue() {
    const nextErrors: Record<string, string> = {};

    if (legalName.trim().length < 2) {
      nextErrors.legalName = "Legal full name is required.";
    }

    if (wordCount < 100) {
      nextErrors.bio = `Bio must be at least 100 words. Current count: ${wordCount}.`;
    }

    topProjects.forEach((project, index) => {
      if (!project.name.trim()) {
        nextErrors[`project-${index}-name`] = "Project name is required.";
      }
      if (!project.description.trim()) {
        nextErrors[`project-${index}-description`] = "Project description is required.";
      }
      if (!project.url.trim()) {
        nextErrors[`project-${index}-url`] = "Project URL is required.";
      } else if (!isHttpsUrl(project.url.trim())) {
        nextErrors[`project-${index}-url`] = "Project URL must be an https:// URL.";
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onNext();
  }

  return (
    <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
          Bio and Projects
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
          Tell reviewers who you are and show the best work you have shipped.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-foreground">
          Legal Full Name
        </label>
        <input
          className="mt-2 h-10 w-full rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          onChange={(event) => onChangeName(event.target.value)}
          value={legalName}
        />
        {errors.legalName ? (
          <p className="mt-1 text-xs text-brand-danger">{errors.legalName}</p>
        ) : null}
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium text-brand-foreground">Bio</label>
          <span
            className={`text-xs ${
              wordCount >= 100 ? "text-brand-success" : "text-brand-foreground-muted"
            }`}
          >
            {wordCount} / 100 words minimum
          </span>
        </div>
        <textarea
          className="mt-2 min-h-40 w-full resize-y rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          onChange={(event) => onChangeBio(event.target.value)}
          placeholder="Describe your engineering background, strongest skills, recent projects, and what kind of work you want next."
          value={bio}
        />
        {errors.bio ? <p className="mt-1 text-xs text-brand-danger">{errors.bio}</p> : null}
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-brand-foreground">Top 3 Projects</h3>
            <p className="mt-1 text-xs text-brand-foreground-muted">
              Add one to three https:// project links.
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={topProjects.length >= 3}
            onClick={addProject}
            size="sm"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Add project
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {topProjects.map((project, index) => (
            <div
              className="rounded-xl border border-brand-border bg-brand-surface p-4"
              key={index}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-foreground-muted">
                  Project {index + 1}
                </p>
                {topProjects.length > 1 ? (
                  <Button
                    aria-label={`Remove project ${index + 1}`}
                    onClick={() => removeProject(index)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4 text-brand-danger" />
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    onChange={(event) =>
                      updateProject(index, "name", event.target.value)
                    }
                    placeholder="Project name"
                    value={project.name}
                  />
                  {errors[`project-${index}-name`] ? (
                    <p className="mt-1 text-xs text-brand-danger">
                      {errors[`project-${index}-name`]}
                    </p>
                  ) : null}
                </div>

                <div>
                  <textarea
                    className="min-h-24 w-full resize-y rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    onChange={(event) =>
                      updateProject(index, "description", event.target.value)
                    }
                    placeholder="What does it do? What did you build?"
                    value={project.description}
                  />
                  {errors[`project-${index}-description`] ? (
                    <p className="mt-1 text-xs text-brand-danger">
                      {errors[`project-${index}-description`]}
                    </p>
                  ) : null}
                </div>

                <div>
                  <input
                    className="h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    onChange={(event) =>
                      updateProject(index, "url", event.target.value)
                    }
                    placeholder="https://github.com/user/project"
                    type="url"
                    value={project.url}
                  />
                  {errors[`project-${index}-url`] ? (
                    <p className="mt-1 text-xs text-brand-danger">
                      {errors[`project-${index}-url`]}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button className="w-full sm:w-auto" onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button className="w-full sm:w-auto" onClick={validateAndContinue} variant="primary">
          Continue
        </Button>
      </div>
    </section>
  );
}
