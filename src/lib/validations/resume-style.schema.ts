import { z } from "zod";

// --- Enums ---
export const ResumeTemplateEnum = z.enum(["compact", "centered", "structured"]);
export const ResumeThemeEnum = z.enum([
  "classic", "modern", "editorial", "executive", "minimal", "academic",
  "slate", "sage", "terracotta", "ocean", "plum", "monochrome",
]);
export const PaperSizeEnum = z.enum(["letter", "a4", "legal"]);
export const AccentColorScopeEnum = z.enum(["all_headings", "name_only", "section_headers_only", "links_icons_only"]);
export const FontFamilyEnum = z.enum([
  "times_new_roman",
  "arial",
  "calibri",
  "georgia",
  "garamond",
  "helvetica",
  "cambria",
]);
export const DateFormatEnum = z.enum(["short_month", "numeric", "full_month", "year_only"]);
export const BulletIconEnum = z.enum(["dot", "dash"]);
export const HeaderAlignEnum = z.enum(["left", "center", "right"]);
export const EducationFieldOrderEnum = z.enum(["degree_first", "institution_first"]);
export const SkillsLayoutEnum = z.enum(["paragraph", "bulleted_list", "dense_wrap"]);

// --- Accent color: accepts #RGB, #RRGGBB, #RRGGBBAA; normalizes to #RRGGBB ---
export const AccentColorSchema = z
  .string()
  .transform((val) => {
    let s = val.replace(/^#/, "");
    if (s.length === 3) s = s.split("").map((c) => c + c).join("");
    return "#" + s.slice(0, 6).toLowerCase();
  })
  .pipe(z.string().regex(/^#[0-9a-f]{6}$/));

// --- Bounds (floors/ceilings) ---
export const BOUNDS = {
  fontSize: {
    name: { min: 14, max: 28 },
    sectionHeaders: { min: 10, max: 16 },
    subHeaders: { min: 9, max: 14 },
    bodyText: { min: 8.5, max: 14 },
  },
  spacing: {
    sectionSpacing: { min: 4, max: 24 },
    entrySpacing: { min: 2, max: 16 },
    lineSpacing: { min: 1.1, max: 1.8 },
    margin: { min: 28.8, max: 72 },
  },
} as const;

// --- Schema ---
export const ResumeStyleConfigSchema = z.object({
  themeId: ResumeThemeEnum.default("classic"),
  template: ResumeTemplateEnum,
  paperSize: PaperSizeEnum,
  accentColor: AccentColorSchema.default("#000000"),
  accentColorScope: AccentColorScopeEnum.default("all_headings"),
  autoFitEnabled: z.boolean().default(true),
  fontFamily: FontFamilyEnum.default("times_new_roman"),
  fontSize: z.object({
    name: z
      .number()
      .min(BOUNDS.fontSize.name.min)
      .max(BOUNDS.fontSize.name.max)
      .default(21),
    sectionHeaders: z
      .number()
      .min(BOUNDS.fontSize.sectionHeaders.min)
      .max(BOUNDS.fontSize.sectionHeaders.max)
      .default(12),
    subHeaders: z
      .number()
      .min(BOUNDS.fontSize.subHeaders.min)
      .max(BOUNDS.fontSize.subHeaders.max)
      .default(11),
    bodyText: z
      .number()
      .min(BOUNDS.fontSize.bodyText.min)
      .max(BOUNDS.fontSize.bodyText.max)
      .default(10),
  }),
  dateFormat: DateFormatEnum.default("short_month"),
  bulletIcon: BulletIconEnum.default("dot"),
  hideDivider: z.boolean().default(false),
  headerAlignment: HeaderAlignEnum.default("center"),
  educationFieldOrder: EducationFieldOrderEnum.default("institution_first"),
  skillsLayout: SkillsLayoutEnum.default("paragraph"),
  spacing: z.object({
    sectionSpacing: z
      .number()
      .min(BOUNDS.spacing.sectionSpacing.min)
      .max(BOUNDS.spacing.sectionSpacing.max)
      .default(8),
    entrySpacing: z
      .number()
      .min(BOUNDS.spacing.entrySpacing.min)
      .max(BOUNDS.spacing.entrySpacing.max)
      .default(4),
    lineSpacing: z
      .number()
      .min(BOUNDS.spacing.lineSpacing.min)
      .max(BOUNDS.spacing.lineSpacing.max)
      .default(1.2),
    margin: z
      .number()
      .min(BOUNDS.spacing.margin.min)
      .max(BOUNDS.spacing.margin.max)
      .default(36),
  }),
  lastFitSnapshot: z
    .object({
      spacing: z.object({
        sectionSpacing: z.number(),
        entrySpacing: z.number(),
        lineSpacing: z.number(),
        margin: z.number(),
      }),
      fontSize: z.object({
        name: z.number(),
        sectionHeaders: z.number(),
        subHeaders: z.number(),
        bodyText: z.number(),
      }),
    })
    .nullable()
    .default(null),
});

export type ResumeStyleConfig = z.infer<typeof ResumeStyleConfigSchema>;

// --- TEMPLATE_DEFAULTS ---
export const TEMPLATE_DEFAULTS: Record<
  z.infer<typeof ResumeTemplateEnum>,
  ResumeStyleConfig
> = {
  compact: {
    themeId: "classic",
    template: "compact",
    paperSize: "letter",
    accentColor: "#000000",
    accentColorScope: "all_headings",
    autoFitEnabled: true,
    fontFamily: "times_new_roman",
    fontSize: { name: 21, sectionHeaders: 12, subHeaders: 11, bodyText: 10 },
    dateFormat: "short_month",
    bulletIcon: "dot",
    hideDivider: false,
    headerAlignment: "center",
    educationFieldOrder: "institution_first",
    skillsLayout: "paragraph",
    spacing: { sectionSpacing: 8, entrySpacing: 4, lineSpacing: 1.2, margin: 36 },
    lastFitSnapshot: null,
  },
  centered: {
    themeId: "classic",
    template: "centered",
    paperSize: "letter",
    accentColor: "#000000",
    accentColorScope: "all_headings",
    autoFitEnabled: true,
    fontFamily: "times_new_roman",
    fontSize: { name: 21, sectionHeaders: 12, subHeaders: 11, bodyText: 10 },
    dateFormat: "short_month",
    bulletIcon: "dot",
    hideDivider: true,
    headerAlignment: "center",
    educationFieldOrder: "institution_first",
    skillsLayout: "bulleted_list",
    spacing: { sectionSpacing: 12, entrySpacing: 5, lineSpacing: 1.3, margin: 43 },
    lastFitSnapshot: null,
  },
  structured: {
    themeId: "classic",
    template: "structured",
    paperSize: "letter",
    accentColor: "#000000",
    accentColorScope: "all_headings",
    autoFitEnabled: true,
    fontFamily: "times_new_roman",
    fontSize: { name: 21, sectionHeaders: 12, subHeaders: 11, bodyText: 10 },
    dateFormat: "short_month",
    bulletIcon: "dot",
    hideDivider: false,
    headerAlignment: "right",
    educationFieldOrder: "institution_first",
    skillsLayout: "dense_wrap",
    spacing: { sectionSpacing: 14, entrySpacing: 6, lineSpacing: 1.35, margin: 54 },
    lastFitSnapshot: null,
  },
};

// --- resolveStyle: deep-merge stored config with defaults ---
export function resolveStyle(raw: unknown): ResumeStyleConfig {
  const base = TEMPLATE_DEFAULTS.compact;
  if (!raw || typeof raw !== "object") return base;
  const parsed = ResumeStyleConfigSchema.safeParse(raw);
  if (!parsed.success) return base;
  const merged = { ...base, ...parsed.data };
  if (parsed.data.fontSize) {
    merged.fontSize = { ...base.fontSize, ...parsed.data.fontSize };
  }
  if (parsed.data.spacing) {
    merged.spacing = { ...base.spacing, ...parsed.data.spacing };
  }
  return merged;
}
