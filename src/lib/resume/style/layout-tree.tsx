// Unified react-pdf resume render tree — single source of truth for
// on-screen preview (client BlobProvider) and PDF export (server renderToStream).
// Template-switch selects a layout wrapper; shared sub-renderers handle all content.
// Keyword highlight + AI-rewrite diff are rendered as styled `<Text>` fragments.

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeDocument, ResumeBullet } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import { buildStyles, type ResumePdfStyles } from "./style-builder";
import { getPdfFamily } from "./fonts";
import { formatDate } from "@/lib/format-date";

// Paper-size → react-pdf Page.size
const PAPER_MAP: Record<string, string> = {
  letter: "LETTER",
  a4: "A4",
  legal: "LEGAL",
};

interface DiffSegment {
  text: string;
  added: boolean;
}

export interface ResumeTreeOpts {
  highlightSkills?: string[];
  contentDiff?: {
    summary: DiffSegment[];
    bullets: Record<string, DiffSegment[]>;
  } | null;
}

const DATE_FORMAT_MAP: Record<string, string> = {
  short_month: "MMM yyyy",
  numeric:     "MM/yyyy",
  full_month:  "MMMM yyyy",
  year_only:   "yyyy",
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------
// Highlight / diff fragment helpers
// ---------------------------------------------------------------

/** Splits text at skill-match boundaries and returns styled <Text> fragments. */
function highlightFragments(
  text: string,
  skills: string[],
  s: ResumePdfStyles,
): React.ReactNode[] {
  if (!skills.length) return [text];
  const sorted = [...skills].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sorted.map((s_) => escapeRegex(s_)).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const match = skills.find(
      (s_) => s_.toLowerCase() === part.toLowerCase(),
    );
    if (match) {
      return (
        <Text key={i} style={s.highlight}>
          {part}
        </Text>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Splits at skill boundaries for skills-section items (no nesting needed). */
function highlightText(
  text: string,
  skills: string[],
  s: ResumePdfStyles,
): React.ReactNode {
  if (!skills.length) return text;
  return <Text>{highlightFragments(text, skills, s)}</Text>;
}

/** Renders diff segments as styled fragments. */
function diffFragments(
  segments: DiffSegment[] | undefined,
  s: ResumePdfStyles,
): React.ReactNode {
  if (!segments?.length) return null;
  return segments.map((seg, i) =>
    seg.added ? (
      <Text key={i} style={s.diffAdded}>
        {seg.text}
      </Text>
    ) : (
      <React.Fragment key={i}>{seg.text}</React.Fragment>
    ),
  );
}

/** Bullet character based on style config. */
function bulletGlyph(config: ResumeStyleConfig): string {
  return config.bulletIcon === "dash" ? "–" : "•";
}

// ---------------------------------------------------------------
// Shared sub-renderers
// ---------------------------------------------------------------

function HeaderBlock({
  doc,
  config,
  s,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
}) {
  const p = doc.personalInfo;
  const contactParts = [p.email, p.phone, p.location, p.twitter].filter(Boolean);
  const urlFields = [
    { label: "LinkedIn", url: p.linkedin },
    { label: "GitHub", url: p.github },
    { label: "Portfolio", url: p.websiteUrl },
  ].filter(({ url }) => url);
  const hasContact = contactParts.length > 0 || urlFields.length > 0;

  return (
    <>
      <Text style={s.name}>{p.name}</Text>
      {hasContact && (
        <Text style={s.contactLine}>
          {contactParts.map((part, i) => (
            <React.Fragment key={`c-${i}`}>
              {i > 0 && <Text>  |  </Text>}
              <Text>{part}</Text>
            </React.Fragment>
          ))}
          {urlFields.length > 0 && contactParts.length > 0 && <Text>  |  </Text>}
          {urlFields.map(({ label, url }, i) => (
            <React.Fragment key={`u-${i}`}>
              {i > 0 && <Text>  |  </Text>}
              <Link src={url!} style={s.link}>
                {label}: {url}
              </Link>
            </React.Fragment>
          ))}
        </Text>
      )}
    </>
  );
}

function SummaryBlock({
  doc,
  s,
  opts,
}: {
  doc: ResumeDocument;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  if (!doc.summary) return null;
  return (
    <>
      <Text style={s.sectionTitle}>Professional Summary</Text>
      <Text style={s.summaryText}>
        {opts.contentDiff?.summary
          ? diffFragments(opts.contentDiff.summary, s)
          : highlightFragments(doc.summary, opts.highlightSkills ?? [], s)}
      </Text>
    </>
  );
}

function ExperienceBlock({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  const entries = doc.experience.filter((e) => e.bullets.length > 0);
  if (!entries.length) return null;
  return (
    <>
      <Text style={s.sectionTitle}>Experience</Text>
      {entries.map((exp) => (
        <View key={exp.id} style={s.expItem} wrap={false}>
          <View style={s.expHeader}>
            <Text>{exp.title}</Text>
            <Text>
              {formatDate(exp.startDate, DATE_FORMAT_MAP[config.dateFormat] ?? "MMM yyyy")}
              {" – "}
              {exp.current ? "Present" : formatDate(exp.endDate, DATE_FORMAT_MAP[config.dateFormat] ?? "MMM yyyy")}
            </Text>
          </View>
          <Text style={s.expSub}>
            {exp.company}
            {exp.location ? ` — ${exp.location}` : ""}
          </Text>
          {exp.bullets
            .sort((a, b) => a.priority - b.priority)
            .map((b) => (
              <Text key={b.id} style={s.bullet}>
                {bulletGlyph(config)} {opts.contentDiff?.bullets?.[b.id]
                  ? diffFragments(opts.contentDiff.bullets[b.id], s)
                  : highlightText(b.text, opts.highlightSkills ?? [], s)}
              </Text>
            ))}
        </View>
      ))}
    </>
  );
}

function ProjectsBlock({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  const entries = doc.projects.filter((p) => p.bullets.length > 0);
  if (!entries.length) return null;
  return (
    <>
      <Text style={s.sectionTitle}>Projects</Text>
      {entries.map((proj) => (
        <View key={proj.id} style={s.projectItem} wrap={false}>
          <Text style={s.projectTitle}>{proj.name}</Text>
          {proj.link ? (
            <Link src={proj.link} style={s.projectLink}>
              {proj.link}
            </Link>
          ) : null}
          {proj.bullets
            .sort((a, b) => a.priority - b.priority)
            .map((b) => (
              <Text key={b.id} style={s.bullet}>
                {bulletGlyph(config)} {highlightText(b.text, opts.highlightSkills ?? [], s)}
              </Text>
            ))}
        </View>
      ))}
    </>
  );
}

function EducationBlock({
  doc,
  config,
  s,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
}) {
  if (!doc.education.length) return null;
  const instFirst = config.educationFieldOrder === "institution_first";
  return (
    <>
      <Text style={s.sectionTitle}>Education</Text>
      {doc.education.map((edu) => (
        <Text key={edu.id} style={s.eduItem}>
          {instFirst ? (
            <>
              {edu.institution}
              {edu.degree ? ` — ${edu.degree}` : ""}
            </>
          ) : (
            <>
              {edu.degree}
              {edu.institution ? ` — ${edu.institution}` : ""}
            </>
          )}
          {edu.endDate ? ` (${formatDate(edu.endDate, DATE_FORMAT_MAP[config.dateFormat] ?? "MMM yyyy")})` : ""}
        </Text>
      ))}
    </>
  );
}

function SkillsBlock({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  if (!doc.skills.categories.length) return null;
  const layout = config.skillsLayout;
  return (
    <>
      <Text style={s.sectionTitle}>Skills</Text>
      {layout === "bulleted_list" ? (
        doc.skills.categories.map((cat) =>
          cat.items.map((item, i) => (
            <Text key={`${cat.name}-${i}`} style={s.bullet}>
              {bulletGlyph(config)} {highlightText(item, opts.highlightSkills ?? [], s)}
            </Text>
          )),
        )
      ) : layout === "dense_wrap" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {doc.skills.categories.flatMap((cat) =>
            cat.items.map((item, j) => (
              <Text key={`${cat.name}-${j}`} style={{ ...s.skillLine, marginRight: 8 }}>
                {highlightText(item, opts.highlightSkills ?? [], s)}
              </Text>
            )),
          )}
        </View>
      ) : (
        // paragraph layout
        doc.skills.categories.map((cat, i) => (
          <Text key={i} style={s.skillLine}>
            <Text style={s.skillLabel}>{cat.name}: </Text>
            {cat.items.map((item, j) => (
              <React.Fragment key={j}>
                {j > 0 && <Text>, </Text>}
                {highlightFragments(item, opts.highlightSkills ?? [], s)}
              </React.Fragment>
            ))}
          </Text>
        ))
      )}
    </>
  );
}

function CertificationsBlock({
  doc,
  config,
  s,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
}) {
  if (!doc.certifications.length) return null;
  return (
    <>
      <Text style={s.sectionTitle}>Certifications</Text>
      {doc.certifications.map((cert) => (
        <Text key={cert.id} style={s.certItem}>
          {cert.name}
          {cert.issuer ? ` — ${cert.issuer}` : ""}
          {cert.date ? ` (${formatDate(cert.date, DATE_FORMAT_MAP[config.dateFormat] ?? "MMM yyyy")})` : ""}
        </Text>
      ))}
    </>
  );
}

function LanguagesBlock({
  doc,
  s,
}: {
  doc: ResumeDocument;
  s: ResumePdfStyles;
}) {
  if (!doc.languages.length) return null;
  return (
    <>
      <Text style={s.sectionTitle}>Languages</Text>
      {doc.languages.map((lang) => (
        <Text key={lang.id} style={s.langItem}>
          {lang.name}
          {lang.proficiency ? ` — ${lang.proficiency}` : ""}
        </Text>
      ))}
    </>
  );
}

// ---------------------------------------------------------------
// Layout wrappers
// ---------------------------------------------------------------

/* CompactLayout — single column, left-aligned, dividers on by default, tight spacing. */
function CompactLayout({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  return (
    <>
      <HeaderBlock doc={doc} config={config} s={s} />
      <SummaryBlock doc={doc} s={s} opts={opts} />
      <ExperienceBlock doc={doc} config={config} s={s} opts={opts} />
      <ProjectsBlock doc={doc} config={config} s={s} opts={opts} />
      <EducationBlock doc={doc} config={config} s={s} />
      <SkillsBlock doc={doc} config={config} s={s} opts={opts} />
      <CertificationsBlock doc={doc} config={config} s={s} />
      <LanguagesBlock doc={doc} s={s} />
    </>
  );
}

/* CenteredLayout — centered name + section titles, dividers off, body left-aligned. */
function CenteredLayout({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  return (
    <>
      <HeaderBlock doc={doc} config={config} s={s} />
      <View style={{ alignItems: "center" }}>
        <SummaryBlock doc={doc} s={s} opts={opts} />
      </View>
      <ExperienceBlock doc={doc} config={config} s={s} opts={opts} />
      <ProjectsBlock doc={doc} config={config} s={s} opts={opts} />
      <EducationBlock doc={doc} config={config} s={s} />
      <SkillsBlock doc={doc} config={config} s={s} opts={opts} />
      <CertificationsBlock doc={doc} config={config} s={s} />
      <LanguagesBlock doc={doc} s={s} />
    </>
  );
}

/* StructuredLayout — right-aligned name, two-zone label/content rows, full-width dividers. */
function StructuredLayout({
  doc,
  config,
  s,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  s: ResumePdfStyles;
  opts: ResumeTreeOpts;
}) {
  return (
    <>
      <HeaderBlock doc={doc} config={config} s={s} />
      <SummaryBlock doc={doc} s={s} opts={opts} />
      <ExperienceBlock doc={doc} config={config} s={s} opts={opts} />
      <ProjectsBlock doc={doc} config={config} s={s} opts={opts} />
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: "30%", paddingRight: 12 }}>
          <Text style={{ ...s.sectionTitle, marginTop: 0 }}>Education</Text>
        </View>
        <View style={{ width: "70%" }}>
          <EducationBlock doc={doc} config={config} s={s} />
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: "30%", paddingRight: 12 }}>
          <Text style={{ ...s.sectionTitle, marginTop: 0 }}>Skills</Text>
        </View>
        <View style={{ width: "70%" }}>
          <SkillsBlock doc={doc} config={config} s={s} opts={opts} />
        </View>
      </View>
      <CertificationsBlock doc={doc} config={config} s={s} />
      <LanguagesBlock doc={doc} s={s} />
    </>
  );
}

// ---------------------------------------------------------------
// Top-level export
// ---------------------------------------------------------------

export function ResumeDocumentTree({
  doc,
  config,
  opts,
}: {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  opts?: ResumeTreeOpts;
}) {
  const s = buildStyles(config);

  const pageStyle = {
    ...s.page,
    fontFamily: getPdfFamily(config.fontFamily),
  };

  const layout = config.template;
  const LayoutWrapper =
    layout === "centered"
      ? CenteredLayout
      : layout === "structured"
        ? StructuredLayout
        : CompactLayout;

  return (
    <Document>
      <Page size={PAPER_MAP[config.paperSize] as "LETTER" | "A4" | "LEGAL" | undefined} style={pageStyle}>
        <LayoutWrapper doc={doc} config={config} s={s} opts={opts ?? {}} />
      </Page>
    </Document>
  );
}
