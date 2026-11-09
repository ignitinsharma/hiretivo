"use client";

import { useEffect, useState } from "react";

interface ModelOption { id: string; name: string; isFree: boolean; supportsFile: boolean; contextLength: number | null }
interface SavedSettings { provider: string; model: string; hasKey: boolean; supportsFile: boolean }

/* Manage a private OpenRouter key and a current model for this local account. */
export function AISettingsSection() {
  const [saved, setSaved] = useState<SavedSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/ai/settings").then(async (response) => {
      if (!response.ok) throw new Error("Could not load model settings");
      return response.json();
    }).then((body) => {
      if (!active) return;
      setSaved(body.data);
      setModel(body.data?.model ?? "");
    }).catch(() => active && setFeedback("Could not load model settings. Refresh to try again.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  /* Send a key only to the local API and show the current catalog without storing it. */
  async function loadModels() {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(apiKey ? { apiKey } : {}) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load models");
      const options = (body.data as ModelOption[]).sort((a, b) => Number(b.isFree) - Number(a.isFree) || a.name.localeCompare(b.name));
      setModels(options);
      if (!options.some((option) => option.id === model)) setModel(options[0]?.id ?? "");
      if (options.length === 0) setFeedback("No text-capable models are currently available.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not load models");
    } finally { setBusy(false); }
  }

  /* Verify the chosen model can answer a small request before a real document is sent. */
  async function testConnection() {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/settings/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(apiKey ? { apiKey } : {}), model }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Connection failed");
      setFeedback("Connection successful. This test may count toward your provider usage.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection failed");
    } finally { setBusy(false); }
  }

  /* Save an encrypted key and model after server-side capability validation. */
  async function save() {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "OPENROUTER", model, ...(apiKey ? { apiKey } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save model settings");
      setSaved(body.data);
      setApiKey("");
      setFeedback("Model settings saved. Your key is hidden after saving.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save model settings");
    } finally { setBusy(false); }
  }

  /* Remove the provider configuration from this account. */
  async function remove() {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/settings", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove model settings");
      setSaved(null); setApiKey(""); setModel(""); setModels([]);
      setFeedback("Model settings removed.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not remove model settings");
    } finally { setBusy(false); }
  }

  return <section className="space-y-5 rounded-xl border border-brand-border bg-white p-5 md:p-6" aria-label="AI model settings">
    <div><h2 className="text-xl font-semibold text-brand-foreground">AI model</h2><p className="mt-1 text-sm text-brand-foreground-muted">Use your own OpenRouter account for resume parsing, tailoring, and cover letters.</p></div>
    <p className="rounded-lg border border-brand-border bg-brand-surface p-3 text-sm text-brand-foreground-muted">When you use a cloud model, resume content and job descriptions are sent to OpenRouter and the selected model provider. Free models can change or reach provider limits. Check the model price before saving.</p>
    {loading ? <p role="status">Loading model settings…</p> : <>
      {saved?.hasKey && <p className="text-sm text-brand-foreground-muted">Saved key: hidden. Enter a new key below only to replace it.</p>}
      <label className="block text-sm font-medium text-brand-foreground">OpenRouter API key<input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={saved?.hasKey ? "Leave blank to keep the saved key" : "Enter your API key"} className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface p-3" /></label>
      <button type="button" onClick={loadModels} disabled={busy || (!apiKey && !saved?.hasKey)} className="min-h-11 rounded-lg border border-brand-border px-4 text-sm font-medium disabled:opacity-50">Load current models</button>
      {models.length > 0 && <label className="block text-sm font-medium text-brand-foreground">Model<select value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface p-3">{models.map((option) => <option key={option.id} value={option.id}>{option.name}{option.isFree ? " · Free now" : ""}{option.supportsFile ? " · PDF input" : " · Text input"}</option>)}</select></label>}
      {model && models.length === 0 && <p className="text-sm text-brand-foreground-muted">Saved model: {model}. Load current models to change it.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" onClick={testConnection} disabled={busy || !model || (!apiKey && !saved?.hasKey)} className="min-h-11 rounded-lg border border-brand-border px-4 text-sm font-medium disabled:opacity-50">Test connection</button><button type="button" onClick={save} disabled={busy || !model || (!apiKey && !saved?.hasKey)} className="min-h-11 rounded-lg bg-brand-primary px-4 text-sm font-medium text-white disabled:opacity-50">Save model</button>{saved && <button type="button" onClick={remove} disabled={busy} className="min-h-11 rounded-lg border border-brand-border px-4 text-sm font-medium text-brand-danger disabled:opacity-50">Remove</button>}</div>
    </>}
    {feedback && <p role="status" className="text-sm text-brand-foreground">{feedback}</p>}
  </section>;
}
