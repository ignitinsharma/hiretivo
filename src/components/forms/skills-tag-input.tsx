"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { X, Plus } from "lucide-react";
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
  placeholder = "Type a skill and press Enter",
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
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  return (
    <div className={cn("relative space-y-2", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 min-h-[48px] w-full rounded-md border border-input bg-background text-base ring-offset-background",
          "focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
          >
            {skill}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 rounded-sm outline-none hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {skill}</span>
              </button>
            )}
          </span>
        ))}
        {!disabled && (
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
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={disabled}
          />
        )}
      </div>

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

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Plus className="h-4 w-4" />
          {placeholder}
        </p>
      )}
    </div>
  );
}
