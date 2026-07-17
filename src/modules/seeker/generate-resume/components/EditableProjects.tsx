"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ResumeProject } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableProjectsProps {
  items: ResumeProject[];
  onChange: (items: ResumeProject[]) => void;
}

export function EditableProjects({ items, onChange }: EditableProjectsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const updateItem = (index: number, item: ResumeProject) => {
    onChange(items.map((e, i) => (i === index ? item : e)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { title: "", url: "", description: "" }]);
    setExpandedIndex(items.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
          Projects
        </label>
        <Button variant="ghost" size="sm" onClick={addItem} type="button">
          <Plus className="mr-1 h-3 w-3" />
          Add project
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-brand-border">
          <button
            type="button"
            onClick={() => toggleExpanded(i)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            aria-expanded={expandedIndex === i}
          >
            {expandedIndex === i ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            )}
            <span className="flex-1 text-sm font-medium text-brand-foreground truncate">
              {item.title || `Project #${i + 1}`}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(i); }}
              className="text-brand-foreground-muted hover:text-brand-danger"
              aria-label={`Remove ${item.title || `project #${i + 1}`}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </button>
          {expandedIndex === i && (
            <div className="border-t border-brand-border p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-brand-foreground-muted">Title</label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(i, { ...item, title: e.target.value })}
                    placeholder="Project name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-brand-foreground-muted">URL</label>
                  <Input
                    value={item.url}
                    onChange={(e) => updateItem(i, { ...item, url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-brand-foreground-muted">Description</label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(i, { ...item, description: e.target.value })}
                  placeholder="Describe your project..."
                  className="min-h-[80px] resize-y text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
