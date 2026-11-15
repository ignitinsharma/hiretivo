"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast, toastResult } from "@/components/toast";
import { AiProvider } from "@/generated/prisma/enums";
import { availableProviderOptions } from "@/lib/ai/hosted-policy";
import { providerOption } from "@/lib/ai/provider-options";

import {
  moveFallbackRoute, removeFallbackRoute, saveFallbackRoute, saveFallbackSwitches,
  savePrimaryFallbackPolicy, testFallbackRoute, type FallbackRouteView, type FallbackSettingsView,
} from "./fallback-actions";

type RouteForm = { id?: string; provider: AiProvider; baseUrl: string; model: string; key: string; cost: "free" | "paid"; approved: boolean };
const blankForm = (): RouteForm => ({ provider: AiProvider.GROQ, baseUrl: providerOption(AiProvider.GROQ).defaultUrl, model: providerOption(AiProvider.GROQ).defaultModel, key: "", cost: "paid", approved: false });

/** Ordered AI models, with an explicit data approval and a separate paid-fallback switch. */
export function AiFallbackSection({ initial }: { initial: FallbackSettingsView }) {
  const [view, setView] = useState(initial);
  const providers = availableProviderOptions(Boolean(view.hosted));
  const [form, setForm] = useState<RouteForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [primaryCost, setPrimaryCost] = useState<"free" | "paid">(initial.routes.find((route) => route.primary)?.cost ?? "paid");
  const [primaryApproved, setPrimaryApproved] = useState(initial.routes.find((route) => route.primary)?.approved ?? false);
  const primary = view.routes.find((route) => route.primary)!;

  const savePrimary = async () => {
    setBusy(true);
    const result = toastResult(await savePrimaryFallbackPolicy({ cost: primaryCost, approved: primaryApproved }));
    if (result.ok) { setView(result.data); toast(view.enabled && !result.data.enabled ? "Fallback turned off because fewer than two approved models remain." : "Primary model policy saved."); }
    setBusy(false);
  };

  const saveRoute = async () => {
    if (!form) return;
    setBusy(true);
    const result = toastResult(await saveFallbackRoute(form));
    if (result.ok) { setView(result.data); setForm(null); toast(view.enabled && !result.data.enabled ? "Fallback turned off because fewer than two approved models remain." : "Fallback model saved."); }
    setBusy(false);
  };

  const changeOrder = async (route: FallbackRouteView, direction: "up" | "down") => {
    setBusy(true);
    const result = toastResult(await moveFallbackRoute({ id: route.id, direction }));
    if (result.ok) { setView(result.data); if (view.enabled && !result.data.enabled) toast("Fallback turned off because fewer than two approved models remain."); }
    setBusy(false);
  };

  const remove = async (route: FallbackRouteView) => {
    setBusy(true);
    const result = toastResult(await removeFallbackRoute({ id: route.id }));
    if (result.ok) { setView(result.data); if (form?.id === route.id) setForm(null); if (view.enabled && !result.data.enabled) toast("Fallback turned off because fewer than two approved models remain."); }
    setBusy(false);
  };

  const toggle = async (field: "enabled" | "paidEnabled", value: boolean) => {
    setBusy(true);
    const result = toastResult(await saveFallbackSwitches({ [field]: value }));
    if (result.ok) setView(result.data);
    setBusy(false);
  };

  return (
    <section className="flex flex-col gap-5" aria-labelledby="fallback-heading">
      <div>
        <h2 id="fallback-heading" className="text-section text-primary-text">Automatic fallback</h2>
        {busy && <span role="status" className="inline-flex items-center gap-2 text-meta text-muted"><Spinner />Saving…</span>}
        <p className="mt-1 text-sm text-muted">When a model is rate limited or temporarily unavailable, try the next approved model in your order. New tasks return to the top model after its cooldown.</p>
      </div>
      <Card className="flex flex-col gap-5">
        <p className="text-meta text-muted">You choose each model&apos;s free or paid label. Hiretivo does not check current prices or enforce a spending cap. A provider may charge your account even for a model you marked free; set billing limits with the provider.</p>
        <ol className="flex flex-col gap-3">
          {view.routes.map((route, index) => (
            <li key={route.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-card px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{index + 1}. {providerOption(route.provider).name} · <span className="font-mono text-[13px]">{route.model || "Choose a model"}</span></p>
                <p className="text-meta text-muted">{route.primary ? "Current AI provider" : "Additional model"} · Marked {route.cost} by you{!route.approved && !providerOption(route.provider).local ? " · approval needed" : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" disabled={busy || index === 0} aria-label={`Move ${route.model} up`} onClick={() => void changeOrder(route, "up")}>↑</Button>
                <Button size="sm" variant="secondary" disabled={busy || index === view.routes.length - 1} aria-label={`Move ${route.model} down`} onClick={() => void changeOrder(route, "down")}>↓</Button>
                {!route.primary && <>
                  <Button size="sm" variant="text" disabled={busy} onClick={() => setForm({ id: route.id, provider: route.provider, baseUrl: route.baseUrl, model: route.model, key: "", cost: route.cost, approved: route.approved })}>Edit</Button>
                  <Button size="sm" variant="text" disabled={busy} onClick={async () => {
                    const result = toastResult(await testFallbackRoute({ id: route.id }));
                    if (result.ok) toast(result.data.connected ? `${route.model} answered in ${(result.data.latencyMs / 1000).toFixed(1)} s.` : result.data.message);
                  }}>Test</Button>
                  <Button size="sm" variant="danger-text" disabled={busy} onClick={() => void remove(route)}>Remove</Button>
                </>}
              </div>
            </li>
          ))}
        </ol>

        <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <Select label="Current model cost label" value={primaryCost} onChange={(event) => setPrimaryCost(event.target.value as "free" | "paid")}>
            <option value="free">Free, as I understand it</option><option value="paid">Paid or possibly paid</option>
          </Select>
          <div className="flex flex-col justify-end gap-2">
            {!providerOption(primary.provider).local && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={primaryApproved} onChange={(event) => setPrimaryApproved(event.target.checked)} className="mt-1" /> I approve sending task data to {providerOption(primary.provider).vendor ?? providerOption(primary.provider).name} during automatic fallback.</label>}
            <Button variant="secondary" size="sm" className="self-start" disabled={busy} onClick={() => void savePrimary()}>Save current model policy</Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={view.enabled} disabled={busy} onChange={(event) => void toggle("enabled", event.target.checked)} className="mt-1" /> Enable automatic fallback</label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={view.paidEnabled} disabled={busy} onChange={(event) => void toggle("paidEnabled", event.target.checked)} className="mt-1" /> Allow automatic fallback to models I marked paid</label>
        </div>
      </Card>

      <Button variant="secondary" className="self-start" onClick={() => setForm(blankForm())}>Add a model</Button>
      {form && <Card className="flex flex-col gap-4">
        <h3 className="font-medium">{form.id ? "Edit fallback model" : "Add fallback model"}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Provider" value={form.provider} onChange={(event) => {
            const provider = event.target.value as AiProvider;
            const option = providers.find((entry) => entry.value === provider) ?? providerOption(provider);
            setForm({ ...form, provider, baseUrl: option.defaultUrl, model: option.defaultModel, key: "", cost: option.local ? "free" : "paid", approved: option.local });
          }}>
            {providers.map((option) => <option key={option.value} value={option.value}>{option.name}</option>)}
          </Select>
          <Select label="Cost label (your choice)" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value as "free" | "paid" })}>
            <option value="free">Free, as I understand it</option><option value="paid">Paid or possibly paid</option>
          </Select>
          <Input label="Server address" readOnly={Boolean(view.hosted)} value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value, approved: providerOption(form.provider).local })} spellCheck={false} />
          <Input label="Model ID" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value, cost: providerOption(form.provider).local ? "free" : "paid" })} spellCheck={false} />
          {providerOption(form.provider).apiKey && <Input label={providerOption(form.provider).apiKey?.label ?? "API key"} type="password" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} placeholder={form.id ? "Leave blank to keep saved key" : "Paste your key"} autoComplete="off" />}
        </div>
        {!providerOption(form.provider).local && <div className="rounded-card bg-warning-surface px-4 py-3 text-sm text-warning">
          <p>{providerOption(form.provider).vendor ?? "This server"} will receive the task data needed for AI work, including profile and job information; resume import and Gmail tasks may contain contact details or messages. Check that provider&apos;s retention and training terms.</p>
          {providerOption(form.provider).freeTierNote && <p className="mt-2">{providerOption(form.provider).freeTierNote}</p>}
          <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={form.approved} onChange={(event) => setForm({ ...form, approved: event.target.checked })} className="mt-1" /> I approve sending this data to this provider during automatic fallback.</label>
        </div>}
        <div className="flex gap-3"><Button disabled={busy} onClick={() => void saveRoute()}>Save model</Button><Button variant="text" onClick={() => setForm(null)}>Cancel</Button></div>
      </Card>}
    </section>
  );
}
