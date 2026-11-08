"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CalendarEventKind } from "@/constants/enums";

interface CalendarEvent {
  id: string;
  applicationId: string;
  kind: CalendarEventKind;
  title: string;
  startsAt: string;
  notes: string | null;
  application: { job: { title: string; companyName: string | null } };
}
interface CalendarApplication { id: string; job: { title: string; companyName: string | null } }
interface EventForm { applicationId: string; kind: CalendarEventKind; title: string; startsAt: string; notes: string }
const emptyForm: EventForm = { applicationId: "", kind: CalendarEventKind.INTERVIEW, title: "", startsAt: "", notes: "" };

/* Loads a JSON API response and surfaces its error as a readable message. */
async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Could not load calendar");
  return body.data as T;
}

/* Manages the local month, agenda, and application event editor. */
export function CalendarWorkspace() {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [view, setView] = useState<"month" | "agenda">("month");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const monthKey = format(month, "yyyy-MM");
  const eventsQuery = useQuery({ queryKey: ["calendar-events", monthKey], queryFn: () => getData<CalendarEvent[]>(`/api/calendar/events?month=${monthKey}`), staleTime: 30_000 });
  const applicationsQuery = useQuery({ queryKey: ["calendar-applications"], queryFn: () => getData<CalendarApplication[]>("/api/calendar/applications"), staleTime: 30_000 });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventForm>({ defaultValues: emptyForm });
  const events = eventsQuery.data ?? [];
  const days = Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(startOfMonth(month)), index));

  /* Saves a new event or updates the event selected for editing. */
  async function save(values: EventForm) {
    setFeedback("");
    setSaving(true);
    try {
      const endpoint = editingId ? `/api/calendar/events/${editingId}` : "/api/calendar/events";
      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startsAt: new Date(values.startsAt).toISOString(), notes: values.notes || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save event");
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setEditingId(null);
      reset(emptyForm);
      setFeedback("Event saved");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save event");
    } finally { setSaving(false); }
  }

  /* Copies a saved event into the editor. */
  function edit(event: CalendarEvent) {
    setEditingId(event.id);
    reset({ applicationId: event.applicationId, kind: event.kind, title: event.title, startsAt: format(new Date(event.startsAt), "yyyy-MM-dd'T'HH:mm"), notes: event.notes ?? "" });
    setFeedback("");
  }

  /* Deletes an event and refreshes the visible month. */
  async function remove(event: CalendarEvent) {
    if (!window.confirm(`Remove ${event.title}?`)) return;
    setFeedback("");
    const response = await fetch(`/api/calendar/events/${event.id}`, { method: "DELETE" });
    if (!response.ok) { setFeedback("Could not remove event"); return; }
    await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    if (editingId === event.id) { setEditingId(null); reset(emptyForm); }
    setFeedback("Event removed");
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight">Calendar</h1><p className="text-sm text-brand-foreground-muted">Interviews and deadlines from your applications, kept here in HireTivo.</p></div>
      <div className="flex items-center gap-2" aria-label="Calendar navigation">
        <button type="button" className="rounded-lg border border-brand-border px-3 py-2 text-sm" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">←</button>
        <span className="min-w-28 text-center font-medium">{format(month, "MMMM yyyy")}</span>
        <button type="button" className="rounded-lg border border-brand-border px-3 py-2 text-sm" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">→</button>
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-4" aria-label="Calendar events">
        <div className="flex gap-2"><button type="button" onClick={() => setView("month")} aria-pressed={view === "month"} className={`rounded-lg px-3 py-2 text-sm ${view === "month" ? "bg-brand-primary text-white" : "border border-brand-border"}`}>Month</button><button type="button" onClick={() => setView("agenda")} aria-pressed={view === "agenda"} className={`rounded-lg px-3 py-2 text-sm ${view === "agenda" ? "bg-brand-primary text-white" : "border border-brand-border"}`}>Agenda</button></div>
        {eventsQuery.isLoading ? <p role="status">Loading events…</p> : eventsQuery.isError ? <div role="alert">Could not load events. <button type="button" className="underline" onClick={() => eventsQuery.refetch()}>Retry</button></div> : view === "month" ?
          <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-brand-border bg-white text-xs sm:text-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <div key={label} className="border-b border-brand-border p-2 text-center font-medium">{label}</div>)}
            {days.map((day) => <div key={day.toISOString()} className={`min-h-20 border-b border-r border-brand-border p-1 sm:min-h-28 sm:p-2 ${isSameMonth(day, month) ? "" : "bg-brand-surface text-brand-foreground-muted"}`}>
              <span className="font-medium">{format(day, "d")}</span>
              {events.filter((event) => isSameDay(new Date(event.startsAt), day)).map((event) => <button key={event.id} type="button" onClick={() => edit(event)} className="mt-1 block w-full truncate rounded-lg bg-brand-primary/10 px-1 py-1 text-left text-brand-primary" title={`${event.title} — ${format(new Date(event.startsAt), "p")}`}>{event.kind === CalendarEventKind.DEADLINE ? "Deadline: " : "Interview: "}{event.title}</button>)}
            </div>)}
          </div> : <EventList events={events.filter((event) => isSameMonth(new Date(event.startsAt), month))} onEdit={edit} onRemove={remove} />}
      </section>
      <section className="self-start rounded-xl border border-brand-border bg-white p-5" aria-label="Event editor">
        <h2 className="mb-4 text-xl font-semibold">{editingId ? "Edit event" : "Add event"}</h2>
        {applicationsQuery.isLoading ? <p role="status">Loading applications…</p> : applicationsQuery.isError ? <div role="alert">Could not load applications. <button type="button" className="underline" onClick={() => applicationsQuery.refetch()}>Retry</button></div> : applicationsQuery.data?.length === 0 ? <p className="text-sm text-brand-foreground-muted">Add an application in the tracker before scheduling an event.</p> : <form onSubmit={handleSubmit(save)} className="space-y-3">
          <label className="block text-sm font-medium">Application<select {...register("applicationId", { required: true })} disabled={!!editingId} className="mt-1 w-full rounded-lg border border-brand-border bg-white p-2"><option value="">Choose an application</option>{applicationsQuery.data?.map((application) => <option key={application.id} value={application.id}>{application.job.title} · {application.job.companyName ?? "Unknown company"}</option>)}</select></label>
          {errors.applicationId && <p className="text-sm text-brand-danger">Choose an application.</p>}
          <label className="block text-sm font-medium">Type<select {...register("kind")} className="mt-1 w-full rounded-lg border border-brand-border bg-white p-2"><option value={CalendarEventKind.INTERVIEW}>Interview</option><option value={CalendarEventKind.DEADLINE}>Deadline</option></select></label>
          <label className="block text-sm font-medium">Title<input {...register("title", { required: true, maxLength: 120 })} maxLength={120} className="mt-1 w-full rounded-lg border border-brand-border p-2" /></label>
          {errors.title && <p className="text-sm text-brand-danger">Enter a title of up to 120 characters.</p>}
          <label className="block text-sm font-medium">Date and time<input type="datetime-local" {...register("startsAt", { required: true })} className="mt-1 w-full rounded-lg border border-brand-border p-2" /></label>
          {errors.startsAt && <p className="text-sm text-brand-danger">Choose a date and time.</p>}
          <label className="block text-sm font-medium">Notes<textarea {...register("notes", { maxLength: 2000 })} rows={3} maxLength={2000} className="mt-1 w-full rounded-lg border border-brand-border p-2" /></label>
          <div className="flex gap-2"><button disabled={saving} type="submit" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Add event"}</button>{editingId && <button type="button" className="rounded-lg border border-brand-border px-4 py-2 text-sm" onClick={() => { setEditingId(null); reset(emptyForm); }}>Cancel</button>}</div>
        </form>}
        {feedback && <p role="status" className="mt-3 text-sm">{feedback}</p>}
      </section>
    </div>
    {view === "month" && !eventsQuery.isLoading && !eventsQuery.isError && <section aria-label="Month agenda"><h2 className="mb-3 text-xl font-semibold">This month</h2><EventList events={events.filter((event) => isSameMonth(new Date(event.startsAt), month))} onEdit={edit} onRemove={remove} /></section>}
  </div>;
}

/* Displays dated event details and edit/remove actions in time order. */
function EventList({ events, onEdit, onRemove }: { events: CalendarEvent[]; onEdit: (event: CalendarEvent) => void; onRemove: (event: CalendarEvent) => void }) {
  if (events.length === 0) return <p className="rounded-xl border border-brand-border bg-white p-6 text-sm text-brand-foreground-muted">No events this month. Add an interview or deadline to get started.</p>;
  return <ul className="space-y-2">{events.map((event) => <li key={event.id} className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-brand-primary">{event.kind === CalendarEventKind.DEADLINE ? "Deadline" : "Interview"} · {format(new Date(event.startsAt), "MMM d, yyyy · p")}</p><p className="font-semibold">{event.title}</p><p className="text-sm text-brand-foreground-muted">{event.application.job.title} · {event.application.job.companyName ?? "Unknown company"}</p>{event.notes && <p className="mt-1 text-sm">{event.notes}</p>}</div><div className="flex gap-2"><button type="button" className="rounded-lg border border-brand-border px-3 py-2 text-sm" onClick={() => onEdit(event)}>Edit</button><button type="button" className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-danger" onClick={() => onRemove(event)}>Remove</button></div></li>)}</ul>;
}
