import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a2e",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    color: "#555",
    marginBottom: 12,
  },
  contact: {
    fontSize: 10,
    color: "#555",
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 3,
  },
  summaryText: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#333",
  },
  skillGroup: {
    fontSize: 10,
    marginBottom: 2,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11,
    fontWeight: "bold",
  },
  expCompany: {
    fontSize: 10,
    color: "#555",
    marginBottom: 2,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.4,
    marginLeft: 12,
    marginBottom: 1,
  },
  eduItem: {
    fontSize: 10,
    marginBottom: 4,
  },
});

function ResumePDF({ doc }: { doc: ResumeDocument }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{doc.fullName}</Text>
        <Text style={styles.headline}>{doc.headline}</Text>
        <View style={styles.contact}>
          {doc.contact.email && <Text>{doc.contact.email}</Text>}
          {doc.contact.location && <Text>{doc.contact.location}</Text>}
          {doc.contact.websiteUrl && <Text>{doc.contact.websiteUrl}</Text>}
          {doc.contact.linkedinUrl && <Text>{doc.contact.linkedinUrl}</Text>}
          {doc.contact.githubUrl && <Text>{doc.contact.githubUrl}</Text>}
        </View>

        {doc.summary && (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{doc.summary}</Text>
          </>
        )}

        {doc.skillGroups.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            {doc.skillGroups.map((group, i) => (
              <Text key={i} style={styles.skillGroup}>
                <Text style={{ fontWeight: "bold" }}>{group.category}: </Text>
                {group.skills.join(", ")}
              </Text>
            ))}
          </>
        )}

        {doc.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {doc.experience.map((exp, i) => (
              <View key={i} style={styles.experienceItem}>
                <View style={styles.expHeader}>
                  <Text>{exp.title}</Text>
                  <Text>{exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}</Text>
                </View>
                <Text style={styles.expCompany}>{exp.company}</Text>
                {exp.bullets.filter(Boolean).map((b, j) => (
                  <Text key={j} style={styles.bullet}>• {b}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        {doc.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {doc.education.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={{ fontWeight: "bold" }}>{edu.institution}</Text>
                {(edu.degree || edu.major) && (
                  <Text>{[edu.degree, edu.major].filter(Boolean).join(" in ")}</Text>
                )}
                {edu.graduationDate && <Text>{edu.graduationDate}</Text>}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(doc: ResumeDocument): Promise<Uint8Array> {
  const stream = await renderToStream(<ResumePDF doc={doc} />);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Uint8Array.from(Buffer.concat(chunks));
}
