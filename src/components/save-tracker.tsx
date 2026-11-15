"use client";

import { createContext, use, useCallback, useEffect, useRef, useState } from "react";

import { registerSaveBarrier } from "@/lib/pending-saves";
import type { AutosaveStatus } from "@/hooks/use-autosave";

type Track = <T>(save: Promise<T>) => Promise<T>;

/** Reports a save to the page's saved indicator. */
export const TrackSaveContext = createContext<Track>((save) => save);

/** Wraps a save (an autosave or an immediate action) so the header's indicator shows it. */
export function useTrackSave(): Track {
  return use(TrackSaveContext);
}

const failed = (result: unknown) =>
  typeof result === "object" && result !== null && "ok" in result && result.ok === false;

/**
 * One "Saving… / Saved just now / Couldn't save" status for a page with many
 * independent saves: saving while any is in flight, otherwise the outcome of
 * the last one.
 */
export function useSaveTracker(): { status: AutosaveStatus; savedAt: Date | null; track: Track } {
  const writes = useRef(new Set<Promise<unknown>>());
  const lastFailed = useRef(false);
  useEffect(() => registerSaveBarrier(async () => { await Promise.allSettled([...writes.current]); return !lastFailed.current; }), []);
  const [pending, setPending] = useState(0);
  const [last, setLast] = useState<{ status: AutosaveStatus; savedAt: Date | null }>({
    status: "idle",
    savedAt: null,
  });

  const track = useCallback<Track>(async (save) => {
    writes.current.add(save);
    setPending((count) => count + 1);
    try {
      const result = await save;
      lastFailed.current = failed(result);
      setLast((previous) =>
        failed(result) ? { ...previous, status: "error" } : { status: "saved", savedAt: new Date() },
      );
      return result;
    } catch (error) {
      lastFailed.current = true;
      setLast((previous) => ({ ...previous, status: "error" }));
      throw error;
    } finally {
      writes.current.delete(save);
      setPending((count) => count - 1);
    }
  }, []);

  return { status: pending > 0 ? "saving" : last.status, savedAt: last.savedAt, track };
}
