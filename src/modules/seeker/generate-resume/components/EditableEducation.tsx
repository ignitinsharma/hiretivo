"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ResumeEducation } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableEducationProps {
  items: ResumeEducation[];
  onChange: (items: ResumeEducation[]) => void;
}

export function EditableEducation({ items, onChange }: EditableEducationProps) {
  const updateItem = (index: number, item: ResumeEducation) => {
    onChange(items.map((e, i) => (i === index ? item : e)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { institution: "", degree: "", major: "", graduationDate: "" }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
          Education
        </label>
        <Button variant="ghost" size="sm" onClick={addItem} type="button">
          <Plus className="mr-1 h-3 w-3" />
          Add education
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-brand-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand-foreground">
              {item.institution || `Education #${i + 1}`}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-brand-foreground-muted hover:text-brand-danger"
              aria-label="Remove education"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Institution</Label>
              <Input value={item.institution} onChange={(e) => updateItem(i, { ...item, institution: e.target.value })} placeholder="University name" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Graduation date</Label>
              <Input value={item.graduationDate} onChange={(e) => updateItem(i, { ...item, graduationDate: e.target.value })} placeholder="e.g. 2024" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Degree</Label>
              <Input value={item.degree} onChange={(e) => updateItem(i, { ...item, degree: e.target.value })} placeholder="e.g. B.Tech" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Major</Label>
              <Input value={item.major} onChange={(e) => updateItem(i, { ...item, major: e.target.value })} placeholder="e.g. Computer Science" className="text-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
