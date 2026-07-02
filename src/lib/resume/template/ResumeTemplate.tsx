import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { resumeStyles as s } from "@/lib/resume/template/styles";
import {
  SummarySection,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  CertificationsSection,
  ProjectsSection,
} from "@/lib/resume/template/sections";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

/*
 * buildContactLine
 * Joins present contact fields into a single ATS-safe text line.
 * @param contact - ResumeDocument.contact
 * @returns "a@b.com · London · github.com/x" (present fields only)
 */
function buildContactLine(contact: ResumeDocument["contact"]): string {
  return [
    contact.email,
    contact.location,
    contact.websiteUrl,
    contact.linkedinUrl,
    contact.githubUrl,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

/*
 * ResumeTemplate
 * The full react-pdf <Document>. Single page, single column, standard fonts,
 * real text only. Sections render in RESUME_SECTION_ORDER; each self-skips when
 * empty. This component is passed to renderToBuffer() by renderResumePdf().
 * @param doc - fully assembled ResumeDocument (Phase 4 output / Phase 5 input)
 */
export function ResumeTemplate({ doc }: { doc: ResumeDocument }) {
  const contactLine = buildContactLine(doc.contact);
  return (
    <Document title={`${doc.fullName} — Resume`} author={doc.fullName}>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.name}>{doc.fullName}</Text>
          {doc.headline ? <Text style={s.headline}>{doc.headline}</Text> : null}
          {contactLine ? (
            <Text style={s.contactLine}>{contactLine}</Text>
          ) : null}
        </View>

        <SummarySection summary={doc.summary} />
        <SkillsSection groups={doc.skillGroups} />
        <ExperienceSection items={doc.experience} />
        <EducationSection items={doc.education} />
        <CertificationsSection items={doc.certifications} />
        <ProjectsSection items={doc.projects} />
      </Page>
    </Document>
  );
}
