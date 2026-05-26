"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { skillService } from "@/services/skill.service";
import { SkillSuggestChips } from "@/modules/recruiter/jobs/components/SkillSuggestChips";

interface SkillPickerProps {
  selectedSkillIds: string[];
  description: string;
  onChange: (next: string[]) => void;
  errorMessage?: string;
}

/*
 * SkillPicker
 * Typeahead + AI suggest UI for picking skills on the admin job form.
 * Owns its own search/dropdown state and the skills query. Lifts only the
 * selected IDs back to the parent form.
 *
 * @param selectedSkillIds - Current set of selected skill IDs
 * @param description - JD text passed to SkillSuggestChips for AI suggestions
 * @param onChange - Called whenever the selected ID set changes
 * @param errorMessage - Optional RHF error message to render under the input
 */
export function SkillPicker({
  selectedSkillIds,
  description,
  onChange,
  errorMessage,
}: SkillPickerProps) {
  const queryClient = useQueryClient();
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["skills-all"],
    queryFn: skillService.getSkills,
    staleTime: 5 * 60 * 1000,
  });

  const selectedSkillsData = useMemo(
    () => skills.filter((s) => selectedSkillIds.includes(s.id)),
    [skills, selectedSkillIds],
  );

  const filteredSkills = useMemo(() => {
    const lower = skillSearch.toLowerCase();
    return skills.filter((s) => s.name.toLowerCase().includes(lower));
  }, [skills, skillSearch]);

  const noMatch =
    showSkillDropdown &&
    skillSearch.trim().length > 0 &&
    filteredSkills.length === 0 &&
    !skillsLoading;

  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return skillService.createSkill({ name, slug, category: "Other" });
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ["skills-all"] });
      onChange([...selectedSkillIds, newSkill.id]);
      setSkillSearch("");
      setShowSkillDropdown(false);
      toast.success(`"${newSkill.name}" added to skills`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeSkill = (skillId: string) => {
    onChange(selectedSkillIds.filter((id) => id !== skillId));
  };

  const addSkillById = (skillId: string) => {
    if (!selectedSkillIds.includes(skillId)) {
      onChange([...selectedSkillIds, skillId]);
    }
  };

  /*
   * handleAddSkillByName
   * Called from SkillSuggestChips. Finds the skill by name in the DB list;
   * if found, adds by ID. If not found, creates it via createSkillMutation.
   */
  const handleAddSkillByName = (skillName: string) => {
    const match = skills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase(),
    );
    if (match) {
      addSkillById(match.id);
    } else {
      createSkillMutation.mutate(skillName);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Skills *</Label>

      {selectedSkillsData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkillsData.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary"
            >
              {skill.name}
              <button
                type="button"
                aria-label={`Remove skill ${skill.name}`}
                onClick={() => removeSkill(skill.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <SkillSuggestChips
        descriptionText={description}
        selectedSkillIds={selectedSkillIds}
        allSkills={skills}
        onAddSkill={handleAddSkillByName}
      />

      <div className="relative" ref={dropdownRef}>
        <Input
          placeholder={skillsLoading ? "Loading skills…" : "Search or add skills…"}
          value={skillSearch}
          onChange={(e) => {
            setSkillSearch(e.target.value);
            setShowSkillDropdown(true);
          }}
          onFocus={() => setShowSkillDropdown(true)}
          disabled={skillsLoading}
          className="pr-10"
          aria-label="Search skills"
          aria-expanded={showSkillDropdown}
          aria-haspopup="listbox"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none">
          <PlusCircle className="w-5 h-5" aria-hidden="true" />
        </span>

        {showSkillDropdown && skillSearch && filteredSkills.length > 0 && (
          <div
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-white border border-brand-border rounded-lg max-h-48 overflow-y-auto"
          >
            {filteredSkills
              .filter((s) => !selectedSkillIds.includes(s.id))
              .slice(0, 8)
              .map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  role="option"
                  aria-selected={selectedSkillIds.includes(skill.id)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-surface text-sm text-brand-foreground transition-colors"
                  onClick={() => {
                    addSkillById(skill.id);
                    setSkillSearch("");
                    setShowSkillDropdown(false);
                  }}
                >
                  {skill.name}{" "}
                  <span className="text-brand-foreground-secondary text-xs">
                    ({skill.category})
                  </span>
                </button>
              ))}
          </div>
        )}

        {noMatch && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-brand-border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-brand-surface text-sm text-brand-primary font-medium transition-colors"
              onClick={() => createSkillMutation.mutate(skillSearch.trim())}
              disabled={createSkillMutation.isPending}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {createSkillMutation.isPending
                ? `Creating "${skillSearch.trim()}"…`
                : `Create "${skillSearch.trim()}" as new skill`}
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-brand-danger">{errorMessage}</p>
      )}
    </div>
  );
}
