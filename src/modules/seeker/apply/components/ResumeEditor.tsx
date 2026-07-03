"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ResumeDocument, ResumeExperience } from "@/modules/seeker/profile/types/resume-document.types";

interface ResumeEditorProps {
  resume: ResumeDocument;
  onChange: (resume: ResumeDocument) => void;
}

/*
 * ResumeEditor
 * Click-to-edit view of the AI-tailored ResumeDocument: summary, flat skill
 * list, and per-experience bullet text. Fully controlled — every edit calls
 * onChange with the next ResumeDocument so the wizard state stays the source
 * of truth (no internal draft copy to desync).
 * @param resume - the tailored document to edit
 * @param onChange - called with the next ResumeDocument on any field edit
 */
export function ResumeEditor({ resume, onChange }: ResumeEditorProps) {
  const skillNames = resume.skillGroups.flatMap((g) => g.skills).join(", ");

  const handleSummaryChange = (summary: string) => {
    onChange({ ...resume, summary });
  };

  const handleSkillsChange = (value: string) => {
    const skills = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ ...resume, skillGroups: skills.length ? [{ category: "Skills", skills }] : [] });
  };

  const handleExperienceChange = (index: number, bullets: string) => {
    const nextExperience: ResumeExperience[] = resume.experience.map((exp, i) =>
      i === index ? { ...exp, bullets: bullets.split("\n").filter(Boolean) } : exp,
    );
    onChange({ ...resume, experience: nextExperience });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="resume-summary">Summary</Label>
        <Textarea
          id="resume-summary"
          value={resume.summary ?? ""}
          onChange={(e) => handleSummaryChange(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="resume-skills">Skills (comma separated)</Label>
        <Textarea
          id="resume-skills"
          value={skillNames}
          onChange={(e) => handleSkillsChange(e.target.value)}
          rows={2}
        />
      </div>

      {resume.experience.map((exp, index) => (
        <div key={`${exp.company}-${exp.title}-${index}`} className="flex flex-col gap-2">
          <Label htmlFor={`resume-experience-${index}`}>
            {exp.title} at {exp.company}
          </Label>
          <Textarea
            id={`resume-experience-${index}`}
            value={exp.bullets.join("\n")}
            onChange={(e) => handleExperienceChange(index, e.target.value)}
            rows={Math.max(3, exp.bullets.length)}
          />
        </div>
      ))}
    </div>
  );
}
