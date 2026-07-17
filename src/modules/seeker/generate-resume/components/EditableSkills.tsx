"use client";

import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumeSkillGroup } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableSkillsProps {
  groups: ResumeSkillGroup[];
  onChange: (groups: ResumeSkillGroup[]) => void;
}

export function EditableSkills({ groups, onChange }: EditableSkillsProps) {
  const updateGroupSkills = (index: number, raw: string) => {
    const next = groups.map((g, i) =>
      i === index
        ? { ...g, skills: raw.split(",").map((s) => s.trim()).filter(Boolean) }
        : g,
    );
    onChange(next);
  };

  const updateCategory = (index: number, category: string) => {
    const next = groups.map((g, i) => (i === index ? { ...g, category } : g));
    onChange(next);
  };

  const addGroup = () => {
    onChange([...groups, { category: "", skills: [] }]);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
          Skills
        </label>
        <Button variant="ghost" size="sm" onClick={addGroup} type="button">
          <Plus className="mr-1 h-3 w-3" />
          Add group
        </Button>
      </div>
      {groups.map((group, i) => (
        <div key={i} className="rounded-lg border border-brand-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={group.category}
              onChange={(e) => updateCategory(i, e.target.value)}
              placeholder="Category (e.g. Languages, Frameworks)"
              className="flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeGroup(i)}
              className="shrink-0 text-brand-foreground-muted hover:text-brand-danger"
              aria-label="Remove skill group"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Input
            value={group.skills.join(", ")}
            onChange={(e) => updateGroupSkills(i, e.target.value)}
            placeholder="Comma-separated skills..."
            className="text-sm"
          />
        </div>
      ))}
    </div>
  );
}
