"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { toast, toastResult } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import type { Tone } from "@/generated/prisma/enums";
import { openPendingTab, sendPendingTab } from "@/lib/claude-tab";

import { handOffToClaude, preparePosting, startAutomaticApplication } from "./actions";

import { TailoringCard } from "./tailoring-card";

type Draft = {
  input: string;
  sourceUrl: string;
  previewText: string | null;
  previewUrl: string;
  tone: Tone;
  note: string;
  jobId: string | null;
  postingId: string | null;
  startupId: string | null;
};

export type FromPosting = {
  id: string | null;
  startup?: { id: string; company: string };
  text: string;
  url: string;
  complete: boolean;
};

export function AutomaticApplicationScreen({
  aiReady,
  writeInClaude = false,
  samplePosting,
  defaultTone,
  fromPosting = null,
  onStarted,
}: {
  onStarted?: (id: string) => void;
  aiReady: boolean;
  writeInClaude?: boolean;
  samplePosting: string | null;
  defaultTone: Tone;
  fromPosting?: FromPosting | null;
}) {
  const [initial] = useState<Draft>(() => ({ input: "", sourceUrl: "", previewText: null, previewUrl: "", tone: defaultTone, note: "", jobId: null, postingId: null, startupId: null }));
  const [draft, updateDraft] = useState<Draft>({ ...initial, input: fromPosting?.text ?? "", sourceUrl: fromPosting?.url ?? "", postingId: fromPosting?.id ?? null, startupId: fromPosting?.startup?.id ?? null });
  const setDraft = (patch: Partial<Draft>) => updateDraft((current) => ({ ...current, ...patch }));
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const previewText = draft.previewText ?? null;

  const submit = async () => {
    if (!previewText?.trim() || starting) return toast("Review the job description before tailoring.");
    if (!aiReady) return toast("Choose an AI model in Settings before creating an application.");
    setError(null);
    setStarting(true);
    const result = await startAutomaticApplication({
      input: previewText,
      sourceUrl: draft.previewUrl,
      tone: draft.tone,
      note: draft.note,
      postingId: draft.postingId,
      startupId: draft.startupId,
    });
    if (!result.ok) setError(result.error);
    setStarting(false);
    if (result.ok) onStarted?.(result.data);
  };

  const review = async () => {
    if (!draft.input.trim() || starting) return toast("Paste a job link or posting first.");
    setError(null);
    setStarting(true);
    const result = await preparePosting({ input: draft.input, sourceUrl: draft.sourceUrl });
    if (!mounted.current) return;
    if (!result.ok) setError(result.error);
    setStarting(false);
    if (result.ok) setDraft({ previewText: result.data.text, previewUrl: result.data.url });
  };

  const writeWithClaude = async () => {
    if (!draft.input.trim()) return toast("Paste a job link or posting first.");
    const chat = openPendingTab();
    setError(null);
    setStarting(true);
    const result = toastResult(await handOffToClaude({ posting: previewText ?? draft.input, postingUrl: draft.previewUrl || draft.sourceUrl || (/^https?:\/\//i.test(draft.input) ? draft.input : "") }));
    setStarting(false);
    if (!result.ok) return void chat?.close();
    sendPendingTab(chat, result.data.url);
    toast("Writing it in Claude. It shows up under Applications as a Draft once Claude has saved it.");
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
            {!aiReady && !writeInClaude && (
              <p role="note" className="rounded-card bg-warning-surface px-4 py-3 text-meta text-warning">
                Choose an AI model in <Link href="/settings?section=ai" className="underline">Settings → AI provider</Link> before creating an application.
              </p>
            )}
            {fromPosting && !fromPosting.complete && (
              <p role="note" className="rounded-card bg-warning-surface px-4 py-3 text-meta text-warning">Only the start of this posting came through. Paste the full description before continuing.</p>
            )}
            {previewText === null ? (
              <Card className="flex flex-col gap-5">
                <GrowingTextarea label="Job link or posting" placeholder="Paste a link, or the full posting with its role, company, and requirements." value={draft.input} onChange={(event) => setDraft({ input: event.target.value })} />
                <p className="text-meta text-muted">A link is fetched from the job site. If that site blocks access, paste its description here instead.</p>
              </Card>
            ) : (
              <Card className="flex flex-col gap-5">
                <h2 className="text-subsection">Review the job description</h2>
                <p className="text-meta text-muted">Correct or add anything the job site left out. Tailoring starts when you approve this text.</p>
                <GrowingTextarea label="Job description" value={previewText} onChange={(event) => setDraft({ previewText: event.target.value })} />
                {draft.previewUrl && <a href={draft.previewUrl} target="_blank" rel="noopener noreferrer" className="text-meta text-primary underline">View original posting ↗</a>}
              </Card>
            )}
            <TailoringCard tone={draft.tone} note={draft.note} onTone={(tone) => setDraft({ tone })} onNote={(note) => setDraft({ note })} />
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-card py-3">
              {previewText === null
                ? samplePosting ? <Button variant="text" onClick={() => setDraft({ input: samplePosting, sourceUrl: "", postingId: null, startupId: null })}>Use a sample posting</Button> : <span />
                : <Button variant="text" onClick={() => setDraft({ previewText: null, previewUrl: "" })}>← Edit link or posting</Button>}
              <Button aria-disabled={!(previewText ?? draft.input).trim() || starting || (previewText !== null && !aiReady && !writeInClaude) || undefined} loading={starting} onClick={() => void (previewText === null ? review() : writeInClaude ? writeWithClaude() : submit())}>
                {previewText === null ? "Review posting →" : writeInClaude ? "Write it with Claude →" : "Start tailoring →"}
              </Button>
            </div>
      </div>
    </>
  );
}

function GrowingTextarea(props: TextareaProps) {
  const element = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = element.current;
    if (!field) return;
    field.style.height = "96px";
    field.style.height = `${Math.min(240, Math.max(96, field.scrollHeight))}px`;
  }, [props.value]);
  return <Textarea {...props} ref={element} rows={3} textareaClassName="min-h-[96px] max-h-[240px] resize-none overflow-y-auto" />;
}
