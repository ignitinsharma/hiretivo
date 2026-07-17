"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EditableSummary } from "@/modules/seeker/generate-resume/components/EditableSummary";
import { EditableSkills } from "@/modules/seeker/generate-resume/components/EditableSkills";
import { EditableExperience } from "@/modules/seeker/generate-resume/components/EditableExperience";
import { EditableEducation } from "@/modules/seeker/generate-resume/components/EditableEducation";
import { EditableCertifications } from "@/modules/seeker/generate-resume/components/EditableCertifications";
import { EditableProjects } from "@/modules/seeker/generate-resume/components/EditableProjects";
import { SectionToggleSidebar, type SectionVisibility } from "@/modules/seeker/generate-resume/components/SectionToggleSidebar";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableResumePreviewProps {
  doc: ResumeDocument;
  onChange: (doc: ResumeDocument) => void;
}

export function EditableResumePreview({ doc, onChange }: EditableResumePreviewProps) {
  const [visibility, setVisibility] = useState<SectionVisibility>({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    projects: true,
  });

  const toggleVisibility = (key: keyof SectionVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const patch = (partial: Partial<ResumeDocument>) => {
    onChange({ ...doc, ...partial });
  };

  const updateContact = (key: keyof ResumeDocument["contact"], value: string) => {
    patch({ contact: { ...doc.contact, [key]: value } });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Editable form */}
      <div className="flex-1 space-y-6">
        <div className="rounded-xl border border-brand-border bg-white p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">Full name</label>
              <Input value={doc.fullName} onChange={(e) => patch({ fullName: e.target.value })} placeholder="Your name" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">Headline</label>
              <Input value={doc.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="e.g. Senior Frontend Engineer" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">Email</label>
              <Input value={doc.contact.email} onChange={(e) => updateContact("email", e.target.value)} placeholder="email@example.com" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">Location</label>
              <Input value={doc.contact.location} onChange={(e) => updateContact("location", e.target.value)} placeholder="City, Country" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">Website</label>
              <Input value={doc.contact.websiteUrl} onChange={(e) => updateContact("websiteUrl", e.target.value)} placeholder="https://" className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">LinkedIn</label>
              <Input value={doc.contact.linkedinUrl} onChange={(e) => updateContact("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">GitHub</label>
              <Input value={doc.contact.githubUrl} onChange={(e) => updateContact("githubUrl", e.target.value)} placeholder="https://github.com/..." className="text-sm" />
            </div>
          </div>
        </div>

        {visibility.summary && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableSummary value={doc.summary} onChange={(v) => patch({ summary: v })} />
          </div>
        )}

        {visibility.skills && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableSkills groups={doc.skillGroups} onChange={(v) => patch({ skillGroups: v })} />
          </div>
        )}

        {visibility.experience && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableExperience items={doc.experience} onChange={(v) => patch({ experience: v })} />
          </div>
        )}

        {visibility.education && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableEducation items={doc.education} onChange={(v) => patch({ education: v })} />
          </div>
        )}

        {visibility.certifications && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableCertifications items={doc.certifications} onChange={(v) => patch({ certifications: v })} />
          </div>
        )}

        {visibility.projects && (
          <div className="rounded-xl border border-brand-border bg-white p-6">
            <EditableProjects items={doc.projects} onChange={(v) => patch({ projects: v })} />
          </div>
        )}
      </div>

      {/* Sidebar — section toggles */}
      <div className="w-full lg:w-48 shrink-0">
        <SectionToggleSidebar visibility={visibility} onChange={toggleVisibility} />
      </div>
    </div>
  );
}


