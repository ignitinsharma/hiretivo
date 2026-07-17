"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

interface ResumeEditorProps {
  doc: ResumeDocument;
  onSaved: (version: { id: string; version: number }) => void;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function ResumeEditor({ doc, onSaved }: ResumeEditorProps) {
  const [form, setForm] = useState<ResumeDocument>(() => deepClone(doc));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ResumeDocument>(
    key: K,
    value: ResumeDocument[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${form.applicationId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeJson: form }),
      });
      if (!res.ok) throw new Error("Save failed");
      const version = await res.json();
      toast.success("Changes saved");
      onSaved(version);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2 border-b border-brand-border">
        <h3 className="text-sm font-bold text-brand-foreground">Edit Resume</h3>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Personal Info */}
      <Section title="Personal Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={form.personalInfo.name} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, name: v } }))} />
          <Field label="Email" value={form.personalInfo.email} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, email: v } }))} />
          <Field label="Phone" value={form.personalInfo.phone} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: v } }))} />
          <Field label="Location" value={form.personalInfo.location ?? ""} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, location: v || null } }))} />
          <Field label="LinkedIn" value={form.personalInfo.linkedin ?? ""} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, linkedin: v || null } }))} />
          <Field label="GitHub" value={form.personalInfo.github ?? ""} onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, github: v || null } }))} />
          <Field label="Website" value={form.personalInfo.websiteUrl ?? ""} className="col-span-2" onChange={(v) => setForm((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, websiteUrl: v || null } }))} />
        </div>
      </Section>

      {/* Summary */}
      <Section title="Professional Summary">
        <textarea
          className="w-full min-h-[80px] rounded-lg border border-brand-border p-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        onAdd={() =>
          set("experience", [
            ...form.experience,
            {
              id: crypto.randomUUID(),
              company: "",
              title: "",
              location: null,
              startDate: "",
              endDate: null,
              current: false,
              bullets: [],
            },
          ])
        }
      >
        {form.experience.map((exp, i) => (
          <div key={exp.id} className="border border-brand-border rounded-lg p-3 space-y-2 relative">
            <button
              className="absolute top-2 right-2 text-brand-foreground-muted hover:text-red-500"
              onClick={() => set("experience", form.experience.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Company" value={exp.company} onChange={(v) => updateExp(i, "company", v)} />
              <Field label="Title" value={exp.title} onChange={(v) => updateExp(i, "title", v)} />
              <Field label="Location" value={exp.location ?? ""} onChange={(v) => updateExp(i, "location", v || null)} />
              <Field label="Start Date" value={exp.startDate} onChange={(v) => updateExp(i, "startDate", v)} />
              <Field label="End Date" value={exp.endDate ?? ""} onChange={(v) => updateExp(i, "endDate", v || null)} />
              <label className="flex items-center gap-2 text-sm text-brand-foreground">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExp(i, "current", e.target.checked)}
                  className="rounded"
                />
                Current position
              </label>
            </div>
            <BulletEditor
              bullets={exp.bullets.map((b) => b.text)}
              onChange={(texts) =>
                updateExp(
                  i,
                  "bullets",
                  texts.map((t) => ({ id: crypto.randomUUID(), text: t, priority: texts.indexOf(t) })),
                )
              }
            />
          </div>
        ))}
      </Section>

      {/* Education */}
      <Section
        title="Education"
        onAdd={() =>
          set("education", [
            ...form.education,
            { id: crypto.randomUUID(), institution: "", degree: "", startDate: "", endDate: "" },
          ])
        }
      >
        {form.education.map((ed, i) => (
          <div key={ed.id} className="border border-brand-border rounded-lg p-3 space-y-2 relative">
            <button
              className="absolute top-2 right-2 text-brand-foreground-muted hover:text-red-500"
              onClick={() => set("education", form.education.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Institution" value={ed.institution} onChange={(v) => updateEd(i, "institution", v)} />
              <Field label="Degree" value={ed.degree} onChange={(v) => updateEd(i, "degree", v)} />
              <Field label="Start" value={ed.startDate} onChange={(v) => updateEd(i, "startDate", v)} />
              <Field label="End" value={ed.endDate} onChange={(v) => updateEd(i, "endDate", v)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        onAdd={() =>
          set("skills", {
            categories: [...form.skills.categories, { name: "", items: [] }],
          })
        }
      >
        {form.skills.categories.map((cat, i) => (
          <div key={i} className="border border-brand-border rounded-lg p-3 space-y-2 relative">
            <button
              className="absolute top-2 right-2 text-brand-foreground-muted hover:text-red-500"
              onClick={() =>
                set("skills", {
                  categories: form.skills.categories.filter((_, j) => j !== i),
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <Field
              label="Category"
              value={cat.name}
              onChange={(v) => {
                const cats = [...form.skills.categories];
                cats[i] = { ...cats[i], name: v };
                set("skills", { categories: cats });
              }}
            />
            <TagsInput
              label="Skills"
              values={cat.items}
              onChange={(items) => {
                const cats = [...form.skills.categories];
                cats[i] = { ...cats[i], items };
                set("skills", { categories: cats });
              }}
            />
          </div>
        ))}
      </Section>

      {/* Certifications */}
      <Section
        title="Certifications"
        onAdd={() =>
          set("certifications", [
            ...form.certifications,
            { id: crypto.randomUUID(), name: "", issuer: null, date: null },
          ])
        }
      >
        {form.certifications.map((cert, i) => (
          <div key={cert.id} className="border border-brand-border rounded-lg p-3 space-y-2 relative">
            <button
              className="absolute top-2 right-2 text-brand-foreground-muted hover:text-red-500"
              onClick={() => set("certifications", form.certifications.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={cert.name} onChange={(v) => updateCert(i, "name", v)} />
              <Field label="Issuer" value={cert.issuer ?? ""} onChange={(v) => updateCert(i, "issuer", v || null)} />
              <Field label="Date" value={cert.date ?? ""} onChange={(v) => updateCert(i, "date", v || null)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Languages */}
      <Section
        title="Languages"
        onAdd={() =>
          set("languages", [
            ...form.languages,
            { id: crypto.randomUUID(), name: "", proficiency: null },
          ])
        }
      >
        {form.languages.map((lang, i) => (
          <div key={lang.id} className="border border-brand-border rounded-lg p-3 space-y-2 relative flex items-center gap-2">
            <button
              className="text-brand-foreground-muted hover:text-red-500"
              onClick={() => set("languages", form.languages.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <input
              className="flex-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Language"
              value={lang.name}
              onChange={(e) => {
                const langs = [...form.languages];
                langs[i] = { ...langs[i], name: e.target.value };
                set("languages", langs);
              }}
            />
            <input
              className="w-24 rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Proficiency"
              value={lang.proficiency ?? ""}
              onChange={(e) => {
                const langs = [...form.languages];
                langs[i] = { ...langs[i], proficiency: e.target.value || null };
                set("languages", langs);
              }}
            />
          </div>
        ))}
      </Section>

      {/* Projects */}
      <Section
        title="Projects"
        onAdd={() =>
          set("projects", [
            ...form.projects,
            { id: crypto.randomUUID(), name: "", link: null, bullets: [] },
          ])
        }
      >
        {form.projects.map((proj, i) => (
          <div key={proj.id} className="border border-brand-border rounded-lg p-3 space-y-2 relative">
            <button
              className="absolute top-2 right-2 text-brand-foreground-muted hover:text-red-500"
              onClick={() => set("projects", form.projects.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={proj.name} onChange={(v) => updateProj(i, "name", v)} />
              <Field label="Link" value={proj.link ?? ""} onChange={(v) => updateProj(i, "link", v || null)} />
            </div>
            <BulletEditor
              bullets={proj.bullets.map((b) => b.text)}
              onChange={(texts) =>
                updateProj(
                  i,
                  "bullets",
                  texts.map((t) => ({ id: crypto.randomUUID(), text: t, priority: texts.indexOf(t) })),
                )
              }
            />
          </div>
        ))}
      </Section>
    </div>
  );

  function updateExp<K extends keyof (typeof form.experience)[0]>(
    index: number,
    key: K,
    value: (typeof form.experience)[0][K],
  ) {
    setForm((prev) => {
      const exps = [...prev.experience];
      exps[index] = { ...exps[index], [key]: value };
      return { ...prev, experience: exps };
    });
  }

  function updateEd<K extends keyof (typeof form.education)[0]>(
    index: number,
    key: K,
    value: (typeof form.education)[0][K],
  ) {
    setForm((prev) => {
      const eds = [...prev.education];
      eds[index] = { ...eds[index], [key]: value };
      return { ...prev, education: eds };
    });
  }

  function updateCert<K extends keyof (typeof form.certifications)[0]>(
    index: number,
    key: K,
    value: (typeof form.certifications)[0][K],
  ) {
    setForm((prev) => {
      const certs = [...prev.certifications];
      certs[index] = { ...certs[index], [key]: value };
      return { ...prev, certifications: certs };
    });
  }

  function updateProj<K extends keyof (typeof form.projects)[0]>(
    index: number,
    key: K,
    value: (typeof form.projects)[0][K],
  ) {
    setForm((prev) => {
      const projs = [...prev.projects];
      projs[index] = { ...projs[index], [key]: value };
      return { ...prev, projects: projs };
    });
  }
}

function Section({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-brand-foreground">{title}</h4>
        {onAdd && (
          <button
            className="text-xs font-medium text-brand-primary hover:text-brand-primary-dark flex items-center gap-1"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-brand-foreground-muted mb-1">
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BulletEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-brand-foreground-muted">Bullets</label>
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <GripVertical className="h-3 w-3 text-brand-foreground-muted shrink-0" />
          <input
            className="flex-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            value={b}
            onChange={(e) => {
              const next = [...bullets];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            className="text-brand-foreground-muted hover:text-red-500 shrink-0"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        className="text-xs font-medium text-brand-primary hover:text-brand-primary-dark flex items-center gap-1"
        onClick={() => onChange([...bullets, ""])}
      >
        <Plus className="h-3 w-3" />
        Add bullet
      </button>
    </div>
  );
}

function TagsInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    if (input.trim()) {
      onChange([...values, input.trim()]);
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-brand-foreground-muted mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-brand-surface px-2 py-0.5 text-xs"
          >
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-500">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          className="flex-1 rounded-lg border border-brand-border px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder={`Add ${label.toLowerCase()}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button
          className="text-xs font-medium text-brand-primary hover:text-brand-primary-dark"
          onClick={add}
        >
          Add
        </button>
      </div>
    </div>
  );
}
