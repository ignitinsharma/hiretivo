"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { JobView } from "@/lib/jobs/runner";
import { toast } from "@/components/toast";

const POLL_MS = 1500;
const finished = (job: JobView) => job.status === "DONE" || job.status === "FAILED";

/**
 * Follows a background job (E6-7): live through Server-Sent Events, or by
 * polling when the stream can't be used. Pass the id kept in the URL or on
 * the record, so a reloaded page picks the job up where it is. Bump
 * `revision` after a Retry to follow the job's new run. `onChange` hears
 * every update, e.g. to move on once the job is done.
 */
export function useJob<R = unknown>(
  id: string | null,
  revision = 0,
  onChange?: (job: JobView<R>) => void,
): JobView<R> | null {
  const router = useRouter();
  const [state, setState] = useState<{ id: string; job: JobView<R> } | null>(null);
  const listener = useRef(onChange);
  useLayoutEffect(() => {
    listener.current = onChange;
  });

  useEffect(() => {
    if (!id) return;
    let stopped = false;
    let fallbackNotified = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = (job: JobView<R>) => {
      if (stopped) return;
      setState({ id, job });
      listener.current?.(job);
      if (!fallbackNotified && job.status === "DONE" && job.fallback) {
        fallbackNotified = true;
        toast(`Used ${job.fallback.toProvider} ${job.fallback.toModel} after ${job.fallback.fromProvider} ${job.fallback.fromModel} was unavailable.`);
      }
      if (!fallbackNotified && job.status === "FAILED" && job.error && (job.error.startsWith("All available AI models") || job.error.startsWith("No approved AI model"))) {
        fallbackNotified = true;
        toast(job.error, { action: { label: "AI Settings", onClick: () => router.push("/settings?section=ai") } });
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        if (response.ok) {
          const job = (await response.json()) as JobView<R>;
          update(job);
          if (finished(job)) return;
        }
      } catch {
        // Offline for a moment: try again.
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    };

    const source = new EventSource(`/api/jobs/${id}/events`);
    source.onmessage = (event: MessageEvent<string>) => {
      const job = JSON.parse(event.data) as JobView<R>;
      update(job);
      if (finished(job)) source.close();
    };
    // Some proxies break event streams: fall back to asking now and then.
    source.onerror = () => {
      source.close();
      if (!stopped) void poll();
    };

    return () => {
      stopped = true;
      source.close();
      clearTimeout(timer);
    };
  }, [id, revision, router]);

  return state && state.id === id ? state.job : null;
}
