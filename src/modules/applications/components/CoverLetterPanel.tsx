"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { SELF_HOSTED } from "@/lib/config";

interface CoverLetterPanelProps {
  applicationId: string;
}

interface CoverLetterData {
  content: string | null;
  id?: string;
  createdAt?: string;
}

const COVER_LETTER_SKELETON = (
  <div className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
    <Skeleton className="h-4 w-1/3" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-1/3" />
  </div>
);

/*
 * CoverLetterPanel
 * Displays, generates, and manages the cover letter for an application.
 * Handles all states: loading skeleton, empty state, generation in-progress, rendered content, and errors.
 */
export function CoverLetterPanel({ applicationId }: CoverLetterPanelProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { data: quota } = useGenerationQuota();
  const coverLetterQuota = quota?.coverLetter;
  const exhausted = !!coverLetterQuota && !coverLetterQuota.allowed;

  const { data, isLoading, isError, refetch } = useQuery<CoverLetterData>({
    queryKey: ["cover-letter", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/cover-letter`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "quota_exceeded") {
          await queryClient.invalidateQueries({ queryKey: ["generation-quota"] });
        }
        throw new Error(json.message ?? json.error ?? "Failed to generate cover letter");
      }
      return json as CoverLetterData;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["cover-letter", applicationId], result);
      queryClient.invalidateQueries({ queryKey: ["generation-quota"] });
      toast.success("Cover letter generated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCopy = async () => {
    if (!data?.content) return;
    try {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const quotaNotice = !SELF_HOSTED && coverLetterQuota ? (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs">
      <span className="font-medium text-brand-foreground-muted">
        Cover letters left this month
      </span>
      <span
        className={`font-semibold ${
          exhausted ? "text-brand-danger" : "text-brand-foreground"
        }`}
      >
        {Math.max(0, coverLetterQuota.limit - coverLetterQuota.used)}/
        {coverLetterQuota.limit}
      </span>
    </div>
  ) : null;

  if (isLoading) {
    return COVER_LETTER_SKELETON;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-brand-foreground-muted mb-4">
          Failed to load cover letter
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return COVER_LETTER_SKELETON;
  }

  if (data?.content) {
    return (
      <div>
        {quotaNotice}
        <div className="rounded-xl border border-brand-border bg-white p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-sm text-brand-foreground leading-relaxed">
              {data.content}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || exhausted}
            title={exhausted ? "Cover letter generation limit reached" : undefined}
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {quotaNotice}
      {exhausted ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-brand-foreground-muted mb-4">
            You&apos;ve used all {coverLetterQuota?.limit} cover letter
            generations this month.
          </p>
          <Button variant="primary" size="sm" asChild>
            <Link href="/pricing">Upgrade for more</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-brand-foreground-muted mb-4">
            No cover letter yet
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Generate Cover Letter
          </Button>
        </div>
      )}
    </div>
  );
}
