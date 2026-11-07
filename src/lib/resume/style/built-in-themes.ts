import { TEMPLATE_DEFAULTS, type ResumeStyleConfig } from "@/lib/validations/resume-style.schema";

export interface BuiltInTheme {
  id: ResumeStyleConfig["themeId"];
  name: string;
  description: string;
  config: ResumeStyleConfig;
}

/* Twelve original combinations of layout, typography, spacing, and accent. */
export const BUILT_IN_THEMES: readonly BuiltInTheme[] = [
  { id: "classic", name: "Classic", description: "Traditional and compact", config: { ...TEMPLATE_DEFAULTS.compact, themeId: "classic" } },
  { id: "modern", name: "Modern", description: "Clear with a cool accent", config: { ...TEMPLATE_DEFAULTS.compact, themeId: "modern", fontFamily: "arial", accentColor: "#1d4ed8", headerAlignment: "left", spacing: { ...TEMPLATE_DEFAULTS.compact.spacing, sectionSpacing: 11 } } },
  { id: "editorial", name: "Editorial", description: "Open and centered", config: { ...TEMPLATE_DEFAULTS.centered, themeId: "editorial", fontFamily: "times_new_roman", accentColor: "#7c2d12", fontSize: { ...TEMPLATE_DEFAULTS.centered.fontSize, name: 24 } } },
  { id: "executive", name: "Executive", description: "Formal and structured", config: { ...TEMPLATE_DEFAULTS.structured, themeId: "executive", fontFamily: "times_new_roman", accentColor: "#1e293b", headerAlignment: "left" } },
  { id: "minimal", name: "Minimal", description: "Quiet and spacious", config: { ...TEMPLATE_DEFAULTS.centered, themeId: "minimal", fontFamily: "helvetica", accentColor: "#111827", hideDivider: true, spacing: { ...TEMPLATE_DEFAULTS.centered.spacing, sectionSpacing: 16, margin: 54 } } },
  { id: "academic", name: "Academic", description: "Classic serif detail", config: { ...TEMPLATE_DEFAULTS.compact, themeId: "academic", fontFamily: "times_new_roman", accentColor: "#374151", fontSize: { ...TEMPLATE_DEFAULTS.compact.fontSize, bodyText: 10.5 }, spacing: { ...TEMPLATE_DEFAULTS.compact.spacing, lineSpacing: 1.3 } } },
  { id: "slate", name: "Slate", description: "Ordered and restrained", config: { ...TEMPLATE_DEFAULTS.structured, themeId: "slate", fontFamily: "arial", accentColor: "#475569", accentColorScope: "section_headers_only" } },
  { id: "sage", name: "Sage", description: "Soft green emphasis", config: { ...TEMPLATE_DEFAULTS.centered, themeId: "sage", fontFamily: "times_new_roman", accentColor: "#3f6b55", headerAlignment: "left", hideDivider: false } },
  { id: "terracotta", name: "Terracotta", description: "Warm and grounded", config: { ...TEMPLATE_DEFAULTS.compact, themeId: "terracotta", fontFamily: "helvetica", accentColor: "#a34f37", fontSize: { ...TEMPLATE_DEFAULTS.compact.fontSize, sectionHeaders: 13 } } },
  { id: "ocean", name: "Ocean", description: "Blue and airy", config: { ...TEMPLATE_DEFAULTS.structured, themeId: "ocean", fontFamily: "helvetica", accentColor: "#0e7490", spacing: { ...TEMPLATE_DEFAULTS.structured.spacing, sectionSpacing: 16 } } },
  { id: "plum", name: "Plum", description: "Refined color accent", config: { ...TEMPLATE_DEFAULTS.centered, themeId: "plum", fontFamily: "times_new_roman", accentColor: "#6b3b66", fontSize: { ...TEMPLATE_DEFAULTS.centered.fontSize, name: 25 } } },
  { id: "monochrome", name: "Monochrome", description: "Sharp black and white", config: { ...TEMPLATE_DEFAULTS.structured, themeId: "monochrome", fontFamily: "arial", accentColor: "#000000", hideDivider: true, bulletIcon: "dash", spacing: { ...TEMPLATE_DEFAULTS.structured.spacing, margin: 47 } } },
];
