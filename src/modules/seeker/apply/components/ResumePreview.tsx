"use client";

import { ResumeSectionHeading } from "@/constants/enums";
import type {
  ResumeDocument,
  ResumeExperience,
  ResumeSkillGroup,
  ResumeEducation,
  ResumeCertification,
  ResumeProject,
} from "@/modules/seeker/profile/types/resume-document.types";

function buildContactLine(contact: ResumeDocument["contact"]): string {
  return [contact.email, contact.location, contact.websiteUrl, contact.linkedinUrl, contact.githubUrl]
    .filter(Boolean)
    .join("  ·  ");
}

function SectionHeading({ heading }: { heading: string }) {
  return (
    <div className="mt-2.5 mb-1 pb-0.5 border-b border-[#e5e7eb]">
      <span className="text-[11px] font-bold text-[#7560ff]">{heading}</span>
    </div>
  );
}

function SummarySection({ summary }: { summary?: string }) {
  if (!summary?.trim()) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.SUMMARY} />
      <p className="text-[10px] text-[#0a0a0a] leading-relaxed mb-0.5">{summary}</p>
    </div>
  );
}

function SkillsSection({ groups }: { groups: ResumeSkillGroup[] }) {
  if (!groups.length) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.SKILLS} />
      {groups.map((g) => (
        <p key={g.category} className="text-[10px] text-[#0a0a0a] mb-0.5">
          <span className="font-bold">{g.category}: </span>
          {g.skills.join(", ")}
        </p>
      ))}
    </div>
  );
}

function ExperienceSection({ items }: { items: ResumeExperience[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.EXPERIENCE} />
      {items.map((e, i) => (
        <div key={`${e.company}-${i}`} className="mb-1">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-[10px] font-bold text-[#0a0a0a]">
              {e.title} — {e.company}
            </span>
            <span className="text-[9px] text-[#6b7280] shrink-0">
              {e.startDate} – {e.isCurrent || !e.endDate ? "Present" : e.endDate}
            </span>
          </div>
          {e.bullets.map((b, bi) => (
            <p key={bi} className="text-[10px] text-[#0a0a0a] ml-2.5 leading-relaxed">
              • {b}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function EducationSection({ items }: { items: ResumeEducation[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.EDUCATION} />
      {items.map((ed, i) => (
        <div key={`${ed.institution}-${i}`} className="mb-1">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-[10px] font-bold text-[#0a0a0a]">{ed.institution}</span>
            {ed.graduationDate ? (
              <span className="text-[9px] text-[#6b7280] shrink-0">{ed.graduationDate}</span>
            ) : null}
          </div>
          {ed.degree || ed.major ? (
            <p className="text-[10px] text-[#0a0a0a]">
              {[ed.degree, ed.major].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({ items }: { items: ResumeCertification[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.CERTIFICATIONS} />
      {items.map((c, i) => (
        <p key={`${c.name}-${i}`} className="text-[10px] text-[#0a0a0a] mb-0.5">
          <span className="font-bold">{c.name}</span>
          {c.issuer ? ` — ${c.issuer}` : ""}
          {c.issueDate ? ` (${c.issueDate})` : ""}
        </p>
      ))}
    </div>
  );
}

function ProjectsSection({ items }: { items: ResumeProject[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading heading={ResumeSectionHeading.PROJECTS} />
      {items.map((p, i) => (
        <div key={`${p.title}-${i}`} className="mb-1">
          <p className="text-[10px] font-bold text-[#0a0a0a]">{p.title}</p>
          {p.url ? (
            <p className="text-[9px] text-[#7560ff]">{p.url}</p>
          ) : null}
          {p.description ? (
            <p className="text-[10px] text-[#0a0a0a]">{p.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/*
 * ResumePreview
 * Renders a ResumeDocument as HTML/CSS, mirroring the @react-pdf ResumeTemplate
 * layout. Used in a dialog so the user can see how their resume will look as a
 * formatted document before finalizing.
 * @param doc - the ResumeDocument to preview
 */
export function ResumePreview({ doc }: { doc: ResumeDocument }) {
  const contactLine = buildContactLine(doc.contact);

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto font-sans">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-[#0a0a0a] mb-0.5">{doc.fullName}</h1>
        {doc.headline ? (
          <p className="text-[11px] text-[#6b7280] mb-1.5">{doc.headline}</p>
        ) : null}
        {contactLine ? (
          <p className="text-[9px] text-[#6b7280] mb-2.5">{contactLine}</p>
        ) : null}
      </div>

      <SummarySection summary={doc.summary} />
      <SkillsSection groups={doc.skillGroups} />
      <ExperienceSection items={doc.experience} />
      <EducationSection items={doc.education} />
      <CertificationsSection items={doc.certifications} />
      <ProjectsSection items={doc.projects} />
    </div>
  );
}
