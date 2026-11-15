"use client";
import { openApplication } from "@/lib/open-application";

import { useState } from "react";

import { toastResult } from "@/components/toast";
import type { FoundPosting } from "@/lib/job-search/search";

import { startApplicationFrom } from "./actions";

/**
 * "Start application" (E14-8): keeps the posting with its whole text, then
 * opens New application with it filled in. `starting` is the posting being
 * handed over, by its key.
 */
export function useStartApplication() {
  const [starting, setStarting] = useState<string | null>(null);

  const start = async (posting: FoundPosting, key: string) => {
    if (starting) return;
    setStarting(key);
    const result = toastResult(await startApplicationFrom({ posting }));
    if (!result.ok) {
      setStarting(null);
      return;
    }
    setStarting(null);
    openApplication({ posting: result.data.postingId });
  };

  return { starting, start };
}
