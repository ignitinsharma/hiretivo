"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeDocument } from "@/lib/validations/resume.schema";
import type { ResumeStyleConfig } from "@/lib/validations/resume-style.schema";
import type { ResumeTreeOpts } from "@/lib/resume/style/layout-tree";

interface UseDebouncedDocInput {
  doc: ResumeDocument;
  config: ResumeStyleConfig;
  opts?: ResumeTreeOpts;
}

interface UseDebouncedDocResult {
  debouncedDoc: { doc: ResumeDocument; config: ResumeStyleConfig; opts?: ResumeTreeOpts };
  pending: boolean;
}

/*
 * useDebouncedDoc — debounces the resume document/config/opts bundle by a
 * configurable millisecond delay so rapid style slider tweaks produce at most
 * one react-pdf re-render per settle window. Memoizes unchanged values to
 * avoid spurious renders.
 */
export function useDebouncedDoc(
  input: UseDebouncedDocInput,
  ms: number,
): UseDebouncedDocResult {
  const [debouncedDoc, setDebouncedDoc] = useState<UseDebouncedDocResult["debouncedDoc"]>(input);
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPending(true);
    timerRef.current = setTimeout(() => {
      setDebouncedDoc(input);
      setPending(false);
    }, ms);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.doc, input.config, input.opts, ms]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { debouncedDoc, pending };
}
