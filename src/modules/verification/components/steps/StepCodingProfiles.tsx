"use client";

import { Code2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CodingProfilesSchema,
  MAX_CODING_PROFILES,
  type CodingProfileInput,
} from "@/lib/verification/coding-profiles";

interface StepCodingProfilesProps {
  value: CodingProfileInput[];
  onChange: (profiles: CodingProfileInput[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function emptyCodingProfile(): CodingProfileInput {
  return {
    platform: "",
    profileUrl: "",
    handle: "",
    evidenceSummary: "",
  };
}

export function StepCodingProfiles({
  value,
  onChange,
  onNext,
  onBack,
}: StepCodingProfilesProps) {
  const [error, setError] = useState<string | null>(null);

  function updateProfile(index: number, field: keyof CodingProfileInput, nextValue: string) {
    onChange(
      value.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: nextValue } : entry,
      ),
    );
    setError(null);
  }

  function removeProfile(index: number) {
    onChange(value.filter((_, entryIndex) => entryIndex !== index));
    setError(null);
  }

  function handleNext() {
    const nonEmptyProfiles = value.filter(
      (entry) => entry.platform.trim() || entry.profileUrl.trim(),
    );
    const parsed = CodingProfilesSchema.safeParse(nonEmptyProfiles);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check coding profile links.");
      return;
    }

    onChange(parsed.data);
    onNext();
  }

  return (
    <section className="space-y-6 rounded-xl border border-brand-border bg-white p-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-brand-foreground">
          <Code2 className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          Coding profiles
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
          Optional LeetCode, Codeforces, CodeChef, HackerRank, or similar links
          can strengthen your code evidence for admin review.
        </p>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-sm text-brand-foreground-muted">
            No coding profiles added. You can skip this step.
          </p>
        </div>
      ) : null}

      {value.map((entry, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-brand-border bg-brand-surface p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={entry.platform}
              onChange={(event) =>
                updateProfile(index, "platform", event.target.value)
              }
              placeholder="Platform, e.g. LeetCode"
              aria-label="Coding platform"
            />
            <Input
              value={entry.profileUrl}
              onChange={(event) =>
                updateProfile(index, "profileUrl", event.target.value)
              }
              placeholder="https://leetcode.com/u/username"
              aria-label="Coding profile URL"
            />
          </div>
          <Input
            value={entry.handle ?? ""}
            onChange={(event) => updateProfile(index, "handle", event.target.value)}
            placeholder="Handle or username (optional)"
            aria-label="Coding profile handle"
          />
          <Textarea
            value={entry.evidenceSummary ?? ""}
            onChange={(event) =>
              updateProfile(index, "evidenceSummary", event.target.value)
            }
            rows={3}
            placeholder="Optional visible stats, contest rating, solved count, or notes"
            aria-label="Coding profile evidence summary"
          />
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => removeProfile(index)}>
              <Trash2 className="h-4 w-4 text-brand-danger" aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      ))}

      {error ? <p className="text-sm text-brand-danger">{error}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            disabled={value.length >= MAX_CODING_PROFILES}
            onClick={() => onChange([...value, emptyCodingProfile()])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Profile
          </Button>
          <Button type="button" variant="primary" onClick={handleNext}>
            Continue
          </Button>
        </div>
      </div>
    </section>
  );
}
