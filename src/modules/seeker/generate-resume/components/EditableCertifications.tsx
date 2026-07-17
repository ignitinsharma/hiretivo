"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumeCertification } from "@/modules/seeker/profile/types/resume-document.types";

interface EditableCertificationsProps {
  items: ResumeCertification[];
  onChange: (items: ResumeCertification[]) => void;
}

export function EditableCertifications({ items, onChange }: EditableCertificationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const updateItem = (index: number, item: ResumeCertification) => {
    onChange(items.map((e, i) => (i === index ? item : e)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { name: "", issuer: "", issueDate: "" }]);
    setExpandedIndex(items.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-foreground uppercase tracking-wider">
          Certifications
        </label>
        <Button variant="ghost" size="sm" onClick={addItem} type="button">
          <Plus className="mr-1 h-3 w-3" />
          Add certification
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-brand-border">
          <button
            type="button"
            onClick={() => toggleExpanded(i)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
          >
            {expandedIndex === i ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-brand-foreground-muted" />
            )}
            <span className="flex-1 text-sm font-medium text-brand-foreground truncate">
              {item.name || item.issuer || `Certification #${i + 1}`}
            </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeItem(i); }}
            className="text-brand-foreground-muted hover:text-brand-danger"
            aria-label={`Remove ${item.name || `certification #${i + 1}`}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          </button>
          {expandedIndex === i && (
            <div className="border-t border-brand-border p-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-brand-foreground-muted">Name</label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(i, { ...item, name: e.target.value })}
                  placeholder="e.g. AWS Solutions Architect"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-brand-foreground-muted">Issuer</label>
                <Input
                  value={item.issuer}
                  onChange={(e) => updateItem(i, { ...item, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-brand-foreground-muted">Issue date</label>
                <Input
                  value={item.issueDate}
                  onChange={(e) => updateItem(i, { ...item, issueDate: e.target.value })}
                  placeholder="e.g. Jan 2023"
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
