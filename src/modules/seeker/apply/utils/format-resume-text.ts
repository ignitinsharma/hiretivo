import { ResumeSectionHeading } from "@/constants/enums";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

/*
 * formatResumeAsText
 * Renders a ResumeDocument as plain text for paste into an ATS resume
 * textarea field. Mirrors src/lib/resume/template/sections.tsx section order
 * and skip rules (empty section => omitted) so the copy-paste text and the
 * generated PDF never disagree on what content exists.
 * @param resume - AI-tailored resume document
 * @returns plain-text resume, section headings uppercase, blank line separated
 */
export function formatResumeAsText(resume: ResumeDocument): string {
  const blocks: string[] = [];

  blocks.push(`=== ${resume.fullName.toUpperCase()} ===`);
  const contactLine = [
    resume.contact.email,
    resume.contact.location,
    resume.contact.websiteUrl,
    resume.contact.linkedinUrl,
    resume.contact.githubUrl,
  ]
    .filter(Boolean)
    .join(" | ");
  if (contactLine) blocks.push(contactLine);

  if (resume.summary?.trim()) {
    blocks.push(`${ResumeSectionHeading.SUMMARY}\n${resume.summary.trim()}`);
  }

  if (resume.skillGroups.length) {
    const lines = resume.skillGroups.map((g) => `${g.category}: ${g.skills.join(", ")}`);
    blocks.push(`${ResumeSectionHeading.SKILLS}\n${lines.join("\n")}`);
  }

  if (resume.experience.length) {
    const lines = resume.experience.map((e) => {
      const header = `${e.company} — ${e.title} (${e.startDate} – ${e.isCurrent || !e.endDate ? "Present" : e.endDate})`;
      const bullets = e.bullets.map((b) => `• ${b}`).join("\n");
      return bullets ? `${header}\n${bullets}` : header;
    });
    blocks.push(`${ResumeSectionHeading.EXPERIENCE}\n${lines.join("\n\n")}`);
  }

  if (resume.education.length) {
    const lines = resume.education.map((ed) => {
      const degreeMajor = [ed.degree, ed.major].filter(Boolean).join(" in ");
      const header = degreeMajor ? `${degreeMajor} — ${ed.institution}` : ed.institution;
      return ed.graduationDate ? `${header} (${ed.graduationDate})` : header;
    });
    blocks.push(`${ResumeSectionHeading.EDUCATION}\n${lines.join("\n")}`);
  }

  if (resume.certifications.length) {
    const lines = resume.certifications.map((c) => {
      const meta = [c.issuer, c.issueDate].filter(Boolean).join(", ");
      return meta ? `${c.name} (${meta})` : c.name;
    });
    blocks.push(`${ResumeSectionHeading.CERTIFICATIONS}\n${lines.join("\n")}`);
  }

  if (resume.projects.length) {
    const lines = resume.projects.map((p) => {
      const parts = [p.title, p.url, p.description].filter(Boolean);
      return parts.join(" — ");
    });
    blocks.push(`${ResumeSectionHeading.PROJECTS}\n${lines.join("\n")}`);
  }

  return blocks.join("\n\n");
}
