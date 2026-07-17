"use client";

interface SectionVisibility {
  summary: boolean;
  skills: boolean;
  experience: boolean;
  education: boolean;
  certifications: boolean;
  projects: boolean;
}

interface SectionToggleSidebarProps {
  visibility: SectionVisibility;
  onChange: (key: keyof SectionVisibility) => void;
}

export type { SectionVisibility };

const SECTIONS: { key: keyof SectionVisibility; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "projects", label: "Projects" },
];

export function SectionToggleSidebar({ visibility, onChange }: SectionToggleSidebarProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4">
      <h3 className="text-xs font-semibold text-brand-foreground uppercase tracking-wider mb-3">
        Sections
      </h3>
      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <label
            key={section.key}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={visibility[section.key]}
              onChange={() => onChange(section.key)}
              className="rounded border-brand-border text-brand-primary focus:ring-brand-primary/20"
            />
            <span className="text-sm text-brand-foreground">{section.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
