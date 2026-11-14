"use client";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/use-job";
import type { ImportProfileResult } from "@/lib/jobs/import-profile";
import { loadImportModal } from "./modal-actions";
import { ProfileImport } from "./profile-import";
type Config = Extract<Awaited<ReturnType<typeof loadImportModal>>, { ok: true }>["data"];
export function ImportResumeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(0);
  const version = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const notices = useRef(new Set<string>());
  const visible = useRef(false);
  const close = useCallback(() => { visible.current = false; version.current++; setOpen(false); setConfig(null); setError(null); }, []);
  const launch = useCallback(async (id?: string) => {
    window.dispatchEvent(new Event("hiretivo:close-application-modal"));
    opener.current = document.activeElement as HTMLElement;
    const token = ++version.current;
    visible.current = true; setOpen(true); setError(null); setConfig(null);
    const result = await loadImportModal({ job: id });
    if (token !== version.current) return;
    if (!result.ok) { setError(result.error); return; }
    setConfig(result.data); setJobId(result.data.initialJobId); setSession((value) => value + 1);
  }, []);
  const job = useJob<ImportProfileResult>(jobId, session, (view) => {
    const key = `hiretivo:import-notice:${view.id}:${view.startedAt ?? "initial"}:${view.status}`;
    if (view.status !== "DONE" && view.status !== "FAILED") return;
    if (notices.current.has(key)) return;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* In-memory fallback. */ }
    notices.current.add(key);
    if (!visible.current) toast(view.status === "DONE" ? "Your resume is ready to review" : "Resume import needs attention", { action: { label: view.status === "DONE" ? "Review import" : "View details", onClick: () => void launch(view.id) } });
  });
  useEffect(() => {
    const recover = async () => {
      const token = version.current;
      const result = await loadImportModal({});
      if (token === version.current && result.ok && !visible.current) setJobId(result.data.initialJobId);
    };
    void recover();
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== "/profile/import") return;
      event.preventDefault(); event.stopPropagation(); void launch(url.searchParams.get("job") ?? undefined);
    };
    const hide = () => close();
    const query = new URLSearchParams(location.search);
    if (query.has("importResume")) {
      const id = query.get("job") ?? undefined;
      query.delete("importResume"); query.delete("job");
      history.replaceState(history.state, "", `${location.pathname}${query.size ? `?${query}` : ""}`);
      queueMicrotask(() => void launch(id));
    }
    document.addEventListener("click", click, true);
    window.addEventListener("hiretivo:close-import-modal", hide);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("hiretivo:close-import-modal", hide); };
  }, [launch, close]);
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    const timer = setInterval(() => { void loadImportModal({ job: jobId }).then((result) => {
      if (stopped || !result.ok || !result.data.unavailable) return;
      setJobId(null);
      if (visible.current) { setConfig(result.data); setSession((value) => value + 1); }
    }); }, 30_000);
    return () => { stopped = true; clearInterval(timer); };
  }, [jobId]);
  const applied = () => {
    setJobId(null); close();
    if (location.pathname === "/resume") {
      const query = new URLSearchParams(location.search); query.set("imported", String(Date.now()));
      router.replace(`/resume?${query}`, { scroll: false });
    } else toast("Your profile and base resume are updated", { action: { label: "View resume", onClick: () => router.push("/resume") } });
    router.refresh();
  };
  return <>
    {!open && (jobId || busy) ? <button onClick={() => void launch(jobId ?? undefined)} className="fixed bottom-20 right-6 z-30 rounded-card border border-line bg-card px-4 py-3 text-sm shadow-menu">{busy ? "Uploading resume…" : job?.status === "DONE" ? "Resume ready — Review import" : job?.status === "FAILED" ? "Import needs attention — View details" : "Reading resume… View progress"}</button> : null}
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content onPointerDownOutside={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%_-_24px)] max-w-[820px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-panel border border-line bg-card shadow-menu">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5"><div><Dialog.Title className="text-section">Import resume</Dialog.Title><Dialog.Description className="text-sm text-muted">Review what was found before merging it into your profile or replacing it.</Dialog.Description></div><Dialog.Close aria-label="Close resume import" className="rounded-control px-3 py-2">✕</Dialog.Close></div>
          <div className="overflow-y-auto p-6">
            {busy && jobId ? <p role="status" className="mb-3 text-sm text-muted">Applying your profile changes…</p> : null}
            {error ? <div role="alert"><p>{error}</p><Button onClick={() => void launch()}>Try again</Button></div>
              : busy && !jobId ? <p role="status">Finishing your upload. It will be ready to review here.</p>
              : config ? <><p className="mb-4 text-sm text-muted">Nothing changes until you apply the import. Unused readings are kept for {config.keptFor}.</p>{config.unavailable ? <p role="alert">That import expired or was removed. Choose the file again.</p> : null}<ProfileImport key={`${session}:${config.initialJobId ?? "new"}`} {...config} embedded externalBusy={busy} onJobChange={(id) => { setJobId(id); setConfig((current) => current ? { ...current, initialJobId: id, unavailable: false } : current); }} onBusyChange={setBusy} onUploadError={(message) => { if (visible.current) setError(message); else toast(message, { action: { label: "Try again", onClick: () => void launch() } }); }} onApplied={applied} /></> : <p role="status">Loading…</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
