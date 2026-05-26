"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { X, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { skillService } from "@/services/skill.service";
import type { SkillItem } from "@/services/skill.service";

interface SkillsTagInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

function hasSkill(skills: string[], nextSkill: string): boolean {
  return skills.some(
    (skill) => skill.trim().toLowerCase() === nextSkill.trim().toLowerCase(),
  );
}

export function SkillsTagInput({
  value,
  onChange,
  placeholder = "Search skills...",
  maxTags = 20,
  disabled = false,
  className,
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allSkills = [] } = useQuery<SkillItem[]>({
    queryKey: ["skills"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = inputValue.trim().length > 0
    ? allSkills
        .filter(
          (s) =>
            s.name.toLowerCase().includes(inputValue.toLowerCase()) &&
            !hasSkill(value, s.name),
        )
        .slice(0, 8)
    : [];

  const addSkillByName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !hasSkill(value, trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
      setInputValue("");
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addSkillByName(suggestions[0].name);
      } else {
        addSkillByName(inputValue);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  return (
    <div className={cn("relative space-y-3", className)}>
      {/* Selected tags above the input */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-sm font-medium text-[#0a0a0a]"
            >
              {skill}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-sm outline-none hover:bg-[#e5e7eb] focus-visible:ring-2 focus-visible:ring-ring p-0.5"
                >
                  <X className="h-3.5 w-3.5 text-[#6b7280]" />
                  <span className="sr-only">Remove {skill}</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search input below the tags */}
      {!disabled && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] pointer-events-none" />
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder={placeholder}
            className="pl-9 w-full"
            disabled={disabled}
          />
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-sm"
        >
          {suggestions.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addSkillByName(skill.name);
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
            >
              <Plus className="mr-2 h-3 w-3 text-slate-400" />
              {skill.name}
              {skill.category && (
                <span className="ml-auto text-xs text-slate-400">{skill.category}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {value.length === 0 && !inputValue && disabled && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Plus className="h-4 w-4" />
          No skills selected
        </p>
      )}
    </div>
  );
}
