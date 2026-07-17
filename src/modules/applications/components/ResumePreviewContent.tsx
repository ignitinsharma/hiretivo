import type { ResumeDocument } from "@/lib/validations/resume.schema";

interface DiffSegment {
  text: string;
  added: boolean;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, skills?: string[]): React.ReactNode {
  if (!skills?.length) return text;

  const sorted = [...skills].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sorted.map((s) => escapeRegex(s)).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const match = skills.find(
      (s) => s.toLowerCase() === part.toLowerCase(),
    );
    if (match) {
      return (
        <mark
          key={i}
          className="bg-green-100 text-green-900 rounded-sm px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

function renderDiff(segments: DiffSegment[]): React.ReactNode {
  if (!segments?.length) return null;
  return segments.map((seg, i) =>
    seg.added ? (
      <mark
        key={i}
        className="bg-green-100 text-green-900 rounded-sm px-0.5"
      >
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

function buildContactLine(doc: ResumeDocument): string {
  const p = doc.personalInfo;
  return [p.email, p.phone, p.location].filter(Boolean).join("  ·  ");
}

export function ResumePreviewContent({
  doc,
  newlyAddedSkills,
  contentDiff,
}: {
  doc: ResumeDocument;
  newlyAddedSkills?: string[];
  contentDiff?: {
    summary: DiffSegment[];
    bullets: Record<string, DiffSegment[]>;
  } | null;
}) {
  const contactLine = buildContactLine(doc);
  const contactUrls = [
    { label: "LinkedIn", url: doc.personalInfo.linkedin },
    { label: "GitHub", url: doc.personalInfo.github },
    { label: "Portfolio", url: doc.personalInfo.websiteUrl },
  ].filter(({ url }) => url);

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto font-sans">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-[#0a0a0a] mb-0.5">
          {doc.personalInfo.name}
        </h1>
        {contactLine && (
          <p className="text-[9px] text-[#6b7280] mb-0.5">{contactLine}</p>
        )}
        {contactUrls.length > 0 && (
          <p className="text-[9px] text-[#6b7280] mb-2.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {contactUrls.map(({ label, url }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                {label}
              </a>
            ))}
          </p>
        )}
      </div>

      {doc.summary && (
        <div>
          <SectionHeading heading="SUMMARY" />
          <p className="text-[10px] text-[#0a0a0a] leading-relaxed mb-0.5">
            {contentDiff?.summary
              ? renderDiff(contentDiff.summary)
              : highlightText(doc.summary, newlyAddedSkills)}
          </p>
        </div>
      )}

      {doc.skills.categories.length > 0 && (
        <div>
          <SectionHeading heading="SKILLS" />
          {doc.skills.categories.map((cat) => (
            <p
              key={cat.name}
              className="text-[10px] text-[#0a0a0a] mb-0.5"
            >
              <span className="font-bold">{cat.name}: </span>
              {cat.items.map((item, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {highlightText(item, newlyAddedSkills)}
                </span>
              ))}
            </p>
          ))}
        </div>
      )}

      {doc.experience.length > 0 && (
        <div>
          <SectionHeading heading="EXPERIENCE" />
          {doc.experience.map((e) => (
            <div key={e.id} className="mb-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#0a0a0a]">
                  {e.title} — {e.company}
                </span>
                <span className="text-[9px] text-[#6b7280] shrink-0">
                  {e.startDate} –{" "}
                  {e.current ? "Present" : e.endDate ?? "Present"}
                </span>
              </div>
              {e.bullets.map((b) => (
                <p
                  key={b.id}
                  className="text-[10px] text-[#0a0a0a] ml-2.5 leading-relaxed"
                >
                  • {contentDiff?.bullets?.[b.id]
                    ? renderDiff(contentDiff.bullets[b.id])
                    : highlightText(b.text, newlyAddedSkills)}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {doc.education.length > 0 && (
        <div>
          <SectionHeading heading="EDUCATION" />
          {doc.education.map((ed) => (
            <div key={ed.id} className="mb-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#0a0a0a]">
                  {ed.institution}
                </span>
                <span className="text-[9px] text-[#6b7280] shrink-0">
                  {ed.endDate}
                </span>
              </div>
              <p className="text-[10px] text-[#0a0a0a]">
                {ed.degree}
              </p>
            </div>
          ))}
        </div>
      )}

      {doc.certifications.length > 0 && (
        <div>
          <SectionHeading heading="CERTIFICATIONS" />
          {doc.certifications.map((c) => (
            <p key={c.id} className="text-[10px] text-[#0a0a0a] mb-0.5">
              <span className="font-bold">{c.name}</span>
              {c.issuer ? ` — ${c.issuer}` : ""}
              {c.date ? ` (${c.date})` : ""}
            </p>
          ))}
        </div>
      )}

      {doc.projects.length > 0 && (
        <div>
          <SectionHeading heading="PROJECTS" />
          {doc.projects.map((p) => (
            <div key={p.id} className="mb-1">
              <p className="text-[10px] font-bold text-[#0a0a0a]">
                {p.name}
              </p>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-brand-primary hover:underline"
                >
                  {p.link}
                </a>
              )}
              {p.bullets.map((b) => (
                <p
                  key={b.id}
                  className="text-[10px] text-[#0a0a0a] ml-2.5 leading-relaxed"
                >
                  • {highlightText(b.text, newlyAddedSkills)}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ heading }: { heading: string }) {
  return (
    <div className="mt-2.5 mb-1 pb-0.5 border-b border-[#e5e7eb]">
      <span className="text-[11px] font-bold text-[#0a0a0a]">{heading}</span>
    </div>
  );
}
