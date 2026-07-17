"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ResumeExperience } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableExperienceProps {
  items: ResumeExperience[];
  onChange: (items: ResumeExperience[]) => void;
}

function ExperienceCard({
  item,
  index,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
}: {
  item: ResumeExperience;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (item: ResumeExperience) => void;
  onRemove: () => void;
}) {
  const updateBullet = (bi: number, value: string) => {
    const next = {
      ...item,
      bullets: item.bullets.map((b, i) => (i === bi ? value : b)),
    };
    onChange(next);
  };

  const addBullet = () => {
    onChange({ ...item, bullets: [...item.bullets, ""] });
  };

  const removeBullet = (bi: number) => {
    onChange({ ...item, bullets: item.bullets.filter((_, i) => i !== bi) });
  };

  return (
    <div className="rounded-lg border border-brand-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={isExpanded}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-brand-foreground-muted" />}
        <span className="flex-1 text-sm font-medium text-brand-foreground truncate">
          {item.title || item.company || `Experience #${index + 1}`}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-brand-foreground-muted hover:text-brand-danger"
          aria-label={`Remove ${item.title || `experience #${index + 1}`}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </button>
      {isExpanded && (
        <div className="border-t border-brand-border p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} placeholder="Job title" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} placeholder="Company" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Input value={item.startDate} onChange={(e) => onChange({ ...item, startDate: e.target.value })} placeholder="e.g. Jan 2020" className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End date</Label>
              <Input value={item.endDate} onChange={(e) => onChange({ ...item, endDate: e.target.value })} placeholder="e.g. Mar 2023" className="text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.isCurrent}
              onChange={(e) => onChange({ ...item, isCurrent: e.target.checked, endDate: e.target.checked ? "" : item.endDate })}
              className="rounded border-brand-border"
            />
            <span className="text-brand-foreground-muted">I currently work here</span>
          </label>
          <div className="space-y-1">
            <Label className="text-xs">Bullets</Label>
            {item.bullets.map((bullet, bi) => (
              <div key={bi} className="flex items-start gap-1">
                <Textarea
                  value={bullet}
                  onChange={(e) => updateBullet(bi, e.target.value)}
                  placeholder="Describe your achievement..."
                  className="min-h-[60px] resize-y text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeBullet(bi)}
                  className="mt-1 shrink-0 text-brand-foreground-muted hover:text-brand-danger"
                  aria-label="Remove bullet point"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addBullet} type="button">
              <Plus className="mr-1 h-3 w-3" />
              Add bullet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditableExperience({ items, onChange }: EditableExperienceProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const updateItem = (index: number, item: ResumeExperience) => {
    onChange(items.map((e, i) => (i === index ? item : e)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([
      ...items,
      { title: "", company: "", startDate: "", endDate: "", isCurrent: false, bullets: [""] },
    ]);
    setExpandedIndex(items.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
          Experience
        </label>
        <Button variant="ghost" size="sm" onClick={addItem} type="button">
          <Plus className="mr-1 h-3 w-3" />
          Add experience
        </Button>
      </div>
      {items.map((item, i) => (
        <ExperienceCard
          key={i}
          item={item}
          index={i}
          isExpanded={expandedIndex === i}
          onToggle={() => toggleExpanded(i)}
          onChange={(e) => updateItem(i, e)}
          onRemove={() => removeItem(i)}
        />
      ))}
    </div>
  );
}
