"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ScanStatus =
  | "idle"
  | "invalid_url"
  | "scanning"
  | "success"
  | "private"
  | "not_found"
  | "timeout";

interface StepGitHubProps {
  value: string;
  onChange: (url: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?\/?$/;

export function StepGitHub({ value, onChange, onNext, onBack }: StepGitHubProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [publicRepoCount, setPublicRepoCount] = useState<number | null>(null);
  const canProceed =
    scanStatus === "success" || scanStatus === "private" || scanStatus === "timeout";

  async function handleScan() {
    const githubUrl = value.trim().replace(/\/$/, "");

    if (!GITHUB_URL_REGEX.test(githubUrl)) {
      setScanStatus("invalid_url");
      return;
    }

    setScanStatus("scanning");
    setPublicRepoCount(null);

    try {
      const response = await fetch("/api/github/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      });
      const result = (await response.json()) as {
        status?: "success" | "private" | "not_found" | "error";
        publicRepoCount?: number;
      };

      if (result.status === "success") {
        setPublicRepoCount(result.publicRepoCount ?? 0);
        setScanStatus("success");
        onChange(githubUrl);
        return;
      }

      if (result.status === "private") {
        setPublicRepoCount(result.publicRepoCount ?? 0);
        setScanStatus("private");
        onChange(githubUrl);
        return;
      }

      if (result.status === "not_found") {
        setScanStatus("not_found");
        return;
      }

      setScanStatus("timeout");
      onChange(githubUrl);
    } catch {
      setScanStatus("timeout");
      onChange(githubUrl);
    }
  }

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6">
      <h2 className="text-xl font-semibold tracking-tight text-brand-foreground">
        GitHub Profile
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-brand-foreground-muted">
        Public GitHub helps admins verify your work. Recruiters only see your
        GitHub link after they unlock your profile, not a repo scan.
      </p>

      <label className="mt-6 block text-sm font-medium text-brand-foreground">
        GitHub URL
      </label>
      <input
        className="mt-2 h-10 w-full rounded-lg border border-brand-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        onChange={(event) => {
          onChange(event.target.value);
          setScanStatus("idle");
          setPublicRepoCount(null);
        }}
        placeholder="https://github.com/username"
        type="url"
        value={value}
      />

      <div className="mt-3 min-h-5 text-sm">
        {scanStatus === "invalid_url" ? (
          <p className="flex items-start gap-2 text-brand-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Enter a GitHub profile URL that starts with https://github.com/.
          </p>
        ) : null}
        {scanStatus === "success" ? (
          <p className="flex items-start gap-2 text-brand-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            GitHub profile confirmed. Found {publicRepoCount ?? 0} public
            repositories.
          </p>
        ) : null}
        {scanStatus === "private" ? (
          <p className="flex items-start gap-2 text-brand-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            No public repositories found. You can still continue for manual
            review.
          </p>
        ) : null}
        {scanStatus === "not_found" ? (
          <p className="flex items-start gap-2 text-brand-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            GitHub profile not found. Check the URL and try again.
          </p>
        ) : null}
        {scanStatus === "timeout" ? (
          <p className="flex items-start gap-2 text-brand-foreground-muted">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            GitHub check timed out. You can still continue for manual review.
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {onBack ? (
          <Button className="w-full sm:w-auto" onClick={onBack} variant="secondary">
            Back
          </Button>
        ) : null}
        {canProceed ? (
          <Button className="w-full sm:w-auto" onClick={onNext} variant="primary">
            Continue
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto"
            disabled={scanStatus === "scanning" || !value.trim()}
            loading={scanStatus === "scanning"}
            loadingText="Checking GitHub..."
            onClick={handleScan}
            variant="primary"
          >
            Check and Continue
          </Button>
        )}
      </div>
    </section>
  );
}
