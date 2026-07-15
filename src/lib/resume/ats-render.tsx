import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

const MARGIN_SHRINK = 0.5;
const MARGIN_DEFAULT = 0.75;
const FONT_SHRINK = 10;
const FONT_DEFAULT = 11;

function buildStyles(fontSize: number, marginInches: number) {
  const margin = marginInches * 72;
  return StyleSheet.create({
    page: {
      padding: margin,
      fontSize,
      fontFamily: "Helvetica",
      color: "#000",
    },
    name: {
      fontSize: fontSize + 4,
      fontWeight: "bold",
      marginBottom: 2,
    },
    contactLine: {
      fontSize: fontSize - 1,
      color: "#333",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: fontSize + 1,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginTop: 10,
      marginBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 1,
    },
    summaryText: {
      fontSize: fontSize - 0.5,
      lineHeight: 1.35,
      marginTop: 2,
    },
    expItem: {
      marginTop: 6,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize,
      fontWeight: "bold",
    },
    expSub: {
      fontSize: fontSize - 0.5,
      color: "#333",
    },
    bullet: {
      fontSize: fontSize - 0.5,
      lineHeight: 1.35,
      marginLeft: 12,
      marginTop: 1,
    },
    skillLine: {
      fontSize: fontSize - 0.5,
      lineHeight: 1.35,
      marginTop: 1,
    },
    eduItem: {
      fontSize: fontSize - 0.5,
      marginTop: 4,
    },
    certItem: {
      fontSize: fontSize - 0.5,
      marginTop: 2,
    },
    langItem: {
      fontSize: fontSize - 0.5,
      marginTop: 1,
    },
    projectItem: {
      marginTop: 6,
    },
    projectTitle: {
      fontSize,
      fontWeight: "bold",
    },
  });
}

interface AtsResumeProps {
  doc: ResumeDocument;
  fontSize: number;
  marginInches: number;
}

function AtsResumePDF({ doc, fontSize, marginInches }: AtsResumeProps) {
  const s = buildStyles(fontSize, marginInches);
  const p = doc.personalInfo;

  const contactParts = [p.email, p.phone, p.location, p.linkedin, p.github, p.websiteUrl, p.twitter].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{p.name}</Text>
        {contactParts.length > 0 && (
          <Text style={s.contactLine}>{contactParts.join("  |  ")}</Text>
        )}

        {doc.summary ? (
          <>
            <Text style={s.sectionTitle}>Professional Summary</Text>
            <Text style={s.summaryText}>{doc.summary}</Text>
          </>
        ) : null}

        {doc.experience.filter((e) => e.bullets.length > 0).length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {doc.experience.filter((e) => e.bullets.length > 0).map((exp) => (
              <View key={exp.id} style={s.expItem}>
                <View style={s.expHeader} wrap={false}>
                  <Text>{exp.title}</Text>
                  <Text>
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </Text>
                </View>
                <Text style={s.expSub}>
                  {exp.company}{exp.location ? ` — ${exp.location}` : ""}
                </Text>
                {exp.bullets
                  .sort((a, b) => a.priority - b.priority)
                  .map((b) => (
                    <Text key={b.id} style={s.bullet}>• {b.text}</Text>
                  ))}
              </View>
            ))}
          </>
        ) : null}

        {doc.projects.filter((p) => p.bullets.length > 0).length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Projects</Text>
            {doc.projects.filter((p) => p.bullets.length > 0).map((proj) => (
              <View key={proj.id} style={s.projectItem}>
                <Text style={s.projectTitle}>
                  {proj.name}{proj.link ? ` — ${proj.link}` : ""}
                </Text>
                {proj.bullets
                  .sort((a, b) => a.priority - b.priority)
                  .map((b) => (
                    <Text key={b.id} style={s.bullet}>• {b.text}</Text>
                  ))}
              </View>
            ))}
          </>
        ) : null}

        {doc.education.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {doc.education.map((edu) => (
              <Text key={edu.id} style={s.eduItem}>
                <Text>{edu.degree}{edu.institution ? ` — ${edu.institution}` : ""}</Text>
                {edu.endDate ? ` (${edu.endDate})` : ""}
              </Text>
            ))}
          </>
        ) : null}

        {doc.skills.categories.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Skills</Text>
            {doc.skills.categories.map((cat, i) => (
              <Text key={i} style={s.skillLine}>
                <Text style={{ fontWeight: "bold" }}>{cat.name}: </Text>
                {cat.items.join(", ")}
              </Text>
            ))}
          </>
        ) : null}

        {doc.certifications.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Certifications</Text>
            {doc.certifications.map((cert) => (
              <Text key={cert.id} style={s.certItem}>
                {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}{cert.date ? ` (${cert.date})` : ""}
              </Text>
            ))}
          </>
        ) : null}

        {doc.languages.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>Languages</Text>
            {doc.languages.map((lang) => (
              <Text key={lang.id} style={s.langItem}>
                {lang.name}{lang.proficiency ? ` — ${lang.proficiency}` : ""}
              </Text>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  );
}

async function renderToBuffer(element: React.ReactElement<React.ComponentProps<typeof Document>>): Promise<Buffer> {
  const stream = await renderToStream(element);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function countPages(pdfBuffer: Buffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}

/*
 * renderAtsResume
 * Renders a ResumeDocument to ATS-safe PDF with fit-to-one-page logic:
 * 1. Default: 11pt font, 0.75" margins
 * 2. On overflow: shrink to 10pt, 0.5" margins
 * 3. Still overflow: trim lowest-priority bullets from oldest experience entry
 * 4. Never silently exceed 1 page — trim notice is returned
 *
 * @returns { pdf: Buffer, trimmedBullets: number }
 */
export async function renderAtsResume(
  doc: ResumeDocument,
): Promise<{ pdf: Buffer; trimmedBullets: number }> {
  // Pass 1: default settings
  let workingDoc = { ...doc };
  let fontSize = FONT_DEFAULT;
  let marginInches = MARGIN_DEFAULT;

  let pdfBuffer = await renderToBuffer(
    <AtsResumePDF doc={workingDoc} fontSize={fontSize} marginInches={marginInches} />,
  );

  let pages = await countPages(pdfBuffer);

  // Pass 2: shrink if overflow
  if (pages > 1) {
    fontSize = FONT_SHRINK;
    marginInches = MARGIN_SHRINK;
    pdfBuffer = await renderToBuffer(
      <AtsResumePDF doc={workingDoc} fontSize={fontSize} marginInches={marginInches} />,
    );
    pages = await countPages(pdfBuffer);
  }

  // Pass 3+: trim bullets if still overflow
  let trimmedBullets = 0;
  while (pages > 1) {
    const removed = trimOneBullet(workingDoc);
    if (!removed) break;
    trimmedBullets++;

    pdfBuffer = await renderToBuffer(
      <AtsResumePDF doc={workingDoc} fontSize={fontSize} marginInches={marginInches} />,
    );
    pages = await countPages(pdfBuffer);
  }

  return { pdf: pdfBuffer, trimmedBullets };
}

/*
 * trimOneBullet
 * Removes the lowest-priority bullet from the oldest experience entry.
 * Mutates workingDoc in place for efficiency (multiple render passes).
 * Returns true if a bullet was removed, false if nothing to trim.
 */
function trimOneBullet(doc: ResumeDocument): boolean {
  const sorted = [...doc.experience.entries()]
    .sort(([, a], [, b]) => {
      const aStart = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bStart = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aStart - bStart;
    });

  for (const [index] of sorted) {
    const exp = doc.experience[index];
    if (exp.bullets.length === 0) continue;

    let lowestIdx = 0;
    let lowestPriority = exp.bullets[0].priority;
    for (let i = 1; i < exp.bullets.length; i++) {
      if (exp.bullets[i].priority > lowestPriority) {
        lowestPriority = exp.bullets[i].priority;
        lowestIdx = i;
      }
    }
    exp.bullets.splice(lowestIdx, 1);
    return true;
  }

  return false;
}
