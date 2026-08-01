// Pure function: converts ResumeStyleConfig → react-pdf StyleSheet.create output.
// All sizes/spacing in pt; lineSpacing is a multiplier.

import { StyleSheet } from "@react-pdf/renderer";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

export function buildStyles(config: ResumeStyleConfig) {
  const { spacing, fontSize, accentColor, accentColorScope, hideDivider, headerAlignment, bulletIcon } = config;
  const margin = spacing.margin;
  const bodySize = fontSize.bodyText;
  const sectionColor = accentColorScope === "all_headings" || accentColorScope === "section_headers_only" ? accentColor : "#000000";
  const nameColor = accentColorScope === "all_headings" || accentColorScope === "name_only" ? accentColor : "#000000";
  const linkColor = accentColorScope === "links_icons_only" ? accentColor : "#2563eb";

  return StyleSheet.create({
    page: {
      padding: margin,
      fontSize: bodySize,
      fontFamily: "Helvetica", // default; overridden in layout-tree via getPdfFamily()
      color: "#000",
    },
    name: {
      fontSize: fontSize.name,
      fontWeight: "bold",
      marginBottom: 2,
      color: nameColor,
      textAlign: headerAlignment === "center" ? "center" : headerAlignment === "right" ? "right" : "left",
    },
    contactLine: {
      fontSize: bodySize - 1,
      color: "#333",
      marginBottom: spacing.sectionSpacing * 0.75,
      textAlign: headerAlignment === "center" ? "center" : headerAlignment === "right" ? "right" : "left",
    },
    sectionTitle: {
      fontSize: fontSize.sectionHeaders,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginTop: spacing.sectionSpacing,
      marginBottom: spacing.entrySpacing * 0.75,
      ...(hideDivider ? {} : { borderBottomWidth: 1, borderBottomColor: sectionColor, paddingBottom: 1 }),
      color: sectionColor,
    },
    summaryText: {
      fontSize: bodySize - 0.5,
      lineHeight: spacing.lineSpacing,
      marginTop: 2,
    },
    expItem: {
      marginTop: spacing.entrySpacing,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: bodySize,
      fontWeight: "bold",
    },
    expSub: {
      fontSize: bodySize - 0.5,
      color: "#333",
    },
    bullet: {
      fontSize: bodySize - 0.5,
      lineHeight: spacing.lineSpacing,
      marginLeft: 12,
      marginTop: 1,
    },
    skillLine: {
      fontSize: bodySize - 0.5,
      lineHeight: spacing.lineSpacing,
      marginTop: 1,
    },
    skillLabel: {
      fontWeight: "bold",
    },
    eduItem: {
      fontSize: bodySize - 0.5,
      marginTop: spacing.entrySpacing * 0.75,
    },
    certItem: {
      fontSize: bodySize - 0.5,
      marginTop: 2,
    },
    langItem: {
      fontSize: bodySize - 0.5,
      marginTop: 1,
    },
    projectItem: {
      marginTop: spacing.entrySpacing,
    },
    projectTitle: {
      fontSize: bodySize,
      fontWeight: "bold",
    },
    projectLink: {
      color: linkColor,
      textDecoration: "underline",
      fontSize: bodySize - 0.5,
    },
    link: {
      color: linkColor,
      textDecoration: "underline",
    },
    highlight: {
      color: "#15803d",
      fontWeight: "bold",
    },
    diffAdded: {
      backgroundColor: "#dcfce7",
    },
    // bulletIcon glyph style
    bulletGlyph: {
      fontSize: bodySize - 0.5,
      marginRight: 3,
    },
  });
}

export type ResumePdfStyles = ReturnType<typeof buildStyles>;
