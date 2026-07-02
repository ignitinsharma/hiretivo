import { StyleSheet } from "@react-pdf/renderer";

/*
 * resumeStyles
 * Shared StyleSheet for the generated resume. Plain values only — Tailwind/
 * brand tokens do NOT apply inside @react-pdf/renderer. Single-column, generous
 * line height, standard font sizes for ATS readability. Accent hex #7560ff
 * mirrors bg-brand-primary intentionally (react-pdf has no token layer).
 */
export const resumeStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0a0a0a",
    lineHeight: 1.4,
  },
  name: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 2 },
  headline: { fontSize: 11, color: "#6b7280", marginBottom: 6 },
  contactLine: { fontSize: 9, color: "#6b7280", marginBottom: 10 },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#7560ff",
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryMeta: { fontSize: 9, color: "#6b7280" },
  bullet: { fontSize: 10, marginLeft: 10, marginBottom: 1 },
  skillGroupLine: { fontSize: 10, marginBottom: 2 },
  skillGroupLabel: { fontFamily: "Helvetica-Bold" },
  paragraph: { fontSize: 10, marginBottom: 2 },
  link: { fontSize: 9, color: "#7560ff" },
});
