"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SkillsTagInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  const addSkill = () => {
    const trimmedSkill = inputValue.trim();
    if (
      trimmedSkill &&
      !value.includes(trimmedSkill) &&
      value.length < maxTags
    ) {
      onChange([...value, trimmedSkill]);
      setInputValue("");
    }
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  return (
    <div className={cn("space-y-2", className)}>
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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSkill}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={disabled}
          />
        )}
      </div>
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Plus className="h-4 w-4" />
          {placeholder}
        </p>
      )}
    </div>
  );
}
