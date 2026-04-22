'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

interface SkillChipProps {
  name: string;
  isAdded: boolean;
  onClick: () => void;
}

function SkillChip({ name, isAdded, onClick }: SkillChipProps) {
  return (
    <button
      type="button"
      disabled={isAdded}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
        isAdded
          ? 'cursor-not-allowed border-primary/30 bg-primary/10 text-primary opacity-70'
          : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary',
      )}
    >
      {isAdded ? '✓ ' : '+ '}
      {name}
    </button>
  );
}

interface SkillSuggestChipsProps {
  descriptionText: string;
  selectedSkillIds: string[];
  allSkills: Array<{ id: string; name: string }>;
  onAddSkill: (skillName: string) => void;
}

export function SkillSuggestChips({
  descriptionText,
  selectedSkillIds,
  allSkills,
  onAddSkill,
}: SkillSuggestChipsProps) {
  const [suggestedSkillNames, setSuggestedSkillNames] = useState<string[]>([]);

  const suggestMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/recruiter/ai/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptionText: text }),
      });
      if (!res.ok) {
        throw new Error('Failed to suggest skills');
      }
      const json = (await res.json()) as { data: { skills: string[] } };
      return json.data.skills;
    },
    onSuccess: (skills) => {
      setSuggestedSkillNames(skills);
    },
    onError: () => {
      toast.error('Could not suggest skills. Try again.');
    },
  });

  const handleSuggest = () => {
    if (!descriptionText || descriptionText.length < 10) {
      toast.error('Add a job description first (at least 10 characters).');
      return;
    }
    suggestMutation.mutate(descriptionText);
  };

  const isSkillAdded = (name: string): boolean =>
    allSkills.some(
      (s) => s.name.toLowerCase() === name.toLowerCase() && selectedSkillIds.includes(s.id),
    );

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={handleSuggest}
        disabled={suggestMutation.isPending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
        aria-label="Suggest skills from job description using AI"
      >
        <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
        {suggestMutation.isPending ? 'Suggesting...' : 'Suggest skills'}
      </button>

      {suggestedSkillNames.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {suggestedSkillNames.map((name) => (
            <SkillChip
              key={name}
              name={name}
              isAdded={isSkillAdded(name)}
              onClick={() => onAddSkill(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
