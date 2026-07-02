import { Text, View, Link } from "@react-pdf/renderer";
import { ResumeSectionHeading } from "@/constants/enums";
import { resumeStyles as s } from "@/lib/resume/template/styles";
import type {
  ResumeSkillGroup,
  ResumeExperience,
  ResumeEducation,
  ResumeCertification,
  ResumeProject,
} from "@/modules/seeker/profile/types/resume-document.types";

/*
 * SectionHeading
 * Renders one standard ATS heading. Pulls text from the enum so headings are
 * never free strings.
 * @param heading - one ResumeSectionHeading value
 */
export function SectionHeading({ heading }: { heading: ResumeSectionHeading }) {
  return <Text style={s.sectionHeading}>{heading}</Text>;
}

/*
 * SummarySection
 * Single paragraph. Renders null when summary is blank (section skipped).
 * @param summary - optional summary text
 */
export function SummarySection({ summary }: { summary?: string }) {
  if (!summary?.trim()) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.SUMMARY} />
      <Text style={s.paragraph}>{summary}</Text>
    </View>
  );
}

/*
 * SkillsSection
 * One wrapping <Text> line per category ("Engineering: React, Node.js").
 * Never a grid — keeps ATS reading order linear.
 * @param groups - skill groups by category
 */
export function SkillsSection({ groups }: { groups: ResumeSkillGroup[] }) {
  if (!groups.length) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.SKILLS} />
      {groups.map((g) => (
        <Text key={g.category} style={s.skillGroupLine}>
          <Text style={s.skillGroupLabel}>{g.category}: </Text>
          {g.skills.join(", ")}
        </Text>
      ))}
    </View>
  );
}

/*
 * ExperienceSection
 * Linear stack; each entry = header row (title @ company | dates) + bullets.
 * @param items - work experience entries
 */
export function ExperienceSection({ items }: { items: ResumeExperience[] }) {
  if (!items.length) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.EXPERIENCE} />
      {items.map((e, i) => (
        <View key={`${e.company}-${i}`} wrap={false}>
          <View style={s.entryHeaderRow}>
            <Text style={s.entryTitle}>
              {e.title} — {e.company}
            </Text>
            <Text style={s.entryMeta}>
              {e.startDate} – {e.isCurrent || !e.endDate ? "Present" : e.endDate}
            </Text>
          </View>
          {e.bullets.map((b, bi) => (
            <Text key={bi} style={s.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/*
 * EducationSection
 * Linear stack of institution + degree/major + date.
 * @param items - education entries
 */
export function EducationSection({ items }: { items: ResumeEducation[] }) {
  if (!items.length) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.EDUCATION} />
      {items.map((ed, i) => (
        <View key={`${ed.institution}-${i}`}>
          <View style={s.entryHeaderRow}>
            <Text style={s.entryTitle}>{ed.institution}</Text>
            {ed.graduationDate ? (
              <Text style={s.entryMeta}>{ed.graduationDate}</Text>
            ) : null}
          </View>
          {ed.degree || ed.major ? (
            <Text style={s.paragraph}>
              {[ed.degree, ed.major].filter(Boolean).join(", ")}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/*
 * CertificationsSection
 * Linear stack: name (issuer, date).
 * @param items - certifications
 */
export function CertificationsSection({
  items,
}: {
  items: ResumeCertification[];
}) {
  if (!items.length) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.CERTIFICATIONS} />
      {items.map((c, i) => (
        <Text key={`${c.name}-${i}`} style={s.paragraph}>
          <Text style={s.entryTitle}>{c.name}</Text>
          {c.issuer ? ` — ${c.issuer}` : ""}
          {c.issueDate ? ` (${c.issueDate})` : ""}
        </Text>
      ))}
    </View>
  );
}

/*
 * ProjectsSection
 * Linear stack: title, optional link (selectable text), description.
 * @param items - projects
 */
export function ProjectsSection({ items }: { items: ResumeProject[] }) {
  if (!items.length) return null;
  return (
    <View>
      <SectionHeading heading={ResumeSectionHeading.PROJECTS} />
      {items.map((p, i) => (
        <View key={`${p.title}-${i}`}>
          <Text style={s.entryTitle}>{p.title}</Text>
          {p.url ? (
            <Link src={p.url} style={s.link}>
              {p.url}
            </Link>
          ) : null}
          {p.description ? (
            <Text style={s.paragraph}>{p.description}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
