"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface StepVideoProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function isValidOptionalHttpsUrl(value: string) {
  if (!value.trim()) return true;

  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

export function StepVideo({ value, onChange, onNext, onBack }: StepVideoProps) {
  const [error, setError] = useState<string | null>(null);

  function continueWithVideo() {
    if (!isValidOptionalHttpsUrl(value)) {
      setError("Video URL must be an https:// URL.");
      return;
    }

    setError(null);
    onNext();
  }

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6">
      <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
        Video Introduction{" "}
        <span className="text-base font-normal text-brand-foreground-muted">
          optional
        </span>
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
        Add a public Loom, YouTube, or other https:// video link, or skip this step.
      </p>

      <label className="mt-6 block text-sm font-medium text-brand-foreground">
        Video URL
      </label>
      <input
        className="mt-2 h-10 w-full rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        onChange={(event) => {
          onChange(event.target.value);
          setError(null);
        }}
        placeholder="https://loom.com/share/..."
        type="url"
        value={value}
      />
      {error ? <p className="mt-2 text-xs text-brand-danger">{error}</p> : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <Button className="w-full sm:w-auto" onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            onChange("");
            setError(null);
            onNext();
          }}
          variant="secondary"
        >
          Skip
        </Button>
        <Button className="w-full sm:w-auto" onClick={continueWithVideo} variant="primary">
          Continue
        </Button>
      </div>
    </section>
  );
}
