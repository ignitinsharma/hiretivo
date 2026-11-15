"use client";

import { Dialog } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/use-job";
import { retry } from "@/lib/jobs/actions";
import { AUTOMATIC_APPLICATION_STEPS } from "@/lib/jobs/application-steps";
import { loadApplicationModal } from "./actions";
import { AutomaticApplicationScreen } from "./automatic-application-screen";
import { JobProgress, jobStep } from "./job-progress";

type Config = Extract<Awaited<ReturnType<typeof loadApplicationModal>>, { ok: true }>["data"];
export function ApplicationModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState(0);
  const visible = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const request = useRef(0);
  const seen = useRef(new Set<string>());
  const changeOpen = useCallback((next: boolean) => { visible.current = next; setOpen(next); if (!next) { request.current++; setConfig(null); setError(null); } }, []);
  const launch = useCallback(async (input: { posting?: string; startup?: string } = {}) => {
    window.dispatchEvent(new Event("hiretivo:close-import-modal"));
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++request.current;
    visible.current = true; setOpen(true); setConfig(null); setError(null); setSession((value) => value + 1);
    const result = await loadApplicationModal(input);
    if (token !== request.current) return;
    if (!result.ok) { setError(result.error); return; }
    if (result.data.activeId) setJobId(result.data.activeId);
    else setJobId(null);
    setConfig(result.data);
  }, []);
  const job = useJob<{ applicationId: string }>(jobId, revision, (view) => {
    const ready = (view.step === AUTOMATIC_APPLICATION_STEPS[2] || view.status === "DONE" || view.status === "FAILED") ? view.applicationId ?? view.result?.applicationId : null;
    const notifyOnce = (kind: string) => {
      const key = `hiretivo:application-notice:${view.id}:${view.startedAt ?? revision}:${kind}`;
      if (seen.current.has(key)) return false;
      try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch { /* In-memory deduplication remains available. */ }
      seen.current.add(key); return true;
    };
    if (ready && notifyOnce("ready")) {
      router.refresh();
      if (visible.current) { changeOpen(false); router.push(`/applications/${ready}`); }
      else toast("Your resume is ready", { action: { label: "Open application", onClick: () => router.push(`/applications/${ready}`) } });
    }
    if (view.status === "FAILED" && notifyOnce("failed")) toast(ready ? "Your resume is saved, but the cover letter needs attention." : "Application generation needs attention.", { action: { label: "View details", onClick: () => { visible.current = true; setOpen(true); } } });
    if (view.status === "DONE") router.refresh();
  });
  useEffect(() => {
    const recover = async () => {
      const token = request.current;
      const result = await loadApplicationModal({});
      if (token !== request.current || visible.current) return;
      if (result.ok && result.data.activeId) setJobId(result.data.activeId);
      else { try { const id = sessionStorage.getItem("hiretivo:application-job"); if (id) { const response = await fetch(`/api/jobs/${id}`); if (response.ok) { const saved = await response.json(); if (token === request.current && !visible.current && saved.type === "automatic-application") setJobId(id); } } } catch { /* Storage may be disabled. */ } }
    };
    void recover();
    const receive = (event: Event) => { void launch((event as CustomEvent).detail ?? {}); };
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a[href]");
      if (!anchor) return;
      const url = new URL((anchor as HTMLAnchorElement).href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname !== "/new") {
        if (anchor.closest('[role="dialog"]')) changeOpen(false);
        return;
      }
      event.preventDefault(); event.stopPropagation();
      void launch({ posting: url.searchParams.get("posting") ?? undefined, startup: url.searchParams.get("startup") ?? undefined });
    };
    const query = new URLSearchParams(location.search);
    if (query.has("newApplication")) {
      const input = { posting: query.get("posting") ?? undefined, startup: query.get("startup") ?? undefined };
      queueMicrotask(() => { void launch(input); });
      for (const key of ["newApplication", "posting", "startup"]) query.delete(key);
      history.replaceState(history.state, "", `${location.pathname}${query.size ? `?${query}` : ""}`);
    }
    const hide = () => changeOpen(false);
    window.addEventListener("hiretivo:close-application-modal", hide);
    window.addEventListener("hiretivo:open-application", receive);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("hiretivo:close-application-modal", hide); window.removeEventListener("hiretivo:open-application", receive); document.removeEventListener("click", click, true); };
  }, [launch, changeOpen]);
  const running = jobId !== null && (!job || job.status === "RUNNING" || job.status === "QUEUED");
  return <>
    {!open && (running || job?.status === "FAILED") ? <button onClick={() => { visible.current = true; setOpen(true); }} className="fixed bottom-6 right-6 z-30 rounded-card border border-line bg-card px-4 py-3 text-sm shadow-menu">{job?.status === "FAILED" ? "Application needs attention — View details" : "Preparing your application… View progress"}</button> : null}
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }} onPointerDownOutside={(event) => event.preventDefault()} className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%_-_24px)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-panel border border-line bg-card shadow-menu">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div><Dialog.Title className="text-section">New application</Dialog.Title><Dialog.Description className="text-sm text-muted">Review a job posting, then tailor your resume and cover letter.</Dialog.Description></div>
            <Dialog.Close aria-label="Close new application" className="rounded-control px-3 py-2">✕</Dialog.Close>
          </div>
          <div className="overflow-y-auto p-6">
            {jobId && (running || job?.status === "FAILED") ? <JobProgress title="Putting your application together…" steps={AUTOMATIC_APPLICATION_STEPS} current={jobStep(AUTOMATIC_APPLICATION_STEPS, job)} error={error ?? job?.error ?? null} onRetry={() => void (async () => { const result = await retry({ id: jobId }); if (result.ok) { setError(null); setRevision((value) => value + 1); } else setError(result.error); })()} onBack={() => { setJobId(null); void launch(); }} />
              : error ? <div role="alert" className="flex flex-col gap-3"><p>{error}</p><Button onClick={() => void launch()}>Try again</Button></div>
              : config ? <AutomaticApplicationScreen key={session} {...config} samplePosting={null} onStarted={(id) => { setJobId(id); try { sessionStorage.setItem("hiretivo:application-job", id); } catch { /* Storage may be disabled. */ } }} /> : <p role="status">Loading…</p>}
            {job?.applicationId ? <Button variant="text" onClick={() => { changeOpen(false); router.push(`/applications/${job.applicationId}`); }}>Open your saved resume Draft →</Button> : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
