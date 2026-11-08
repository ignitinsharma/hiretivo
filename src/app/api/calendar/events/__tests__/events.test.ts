import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";

let userId: string | null = "owner";
const events: Array<{ id: string; applicationId: string; kind: string; title: string; startsAt: Date; notes: string | null; application: { seekerId: string; job: { title: string; companyName: string | null } } }> = [];

before(() => {
  mock.module("@/auth", { namedExports: { auth: async () => userId ? { user: { id: userId } } : null } });
  mock.module("@/lib/rate-limit", { namedExports: { createRateLimiter: () => ({ limit: async () => ({ success: true }) }) } });
  mock.module("@/lib/prisma", { namedExports: { prisma: {
    application: { findFirst: async ({ where }: { where: { id: string; seekerId: string } }) => where.id === "app-owner" && where.seekerId === "owner" ? { id: where.id } : null },
    calendarEvent: {
      findMany: async ({ where }: { where: { application: { seekerId: string }; startsAt: { gte: Date; lt: Date } } }) => events.filter((event) => event.application.seekerId === where.application.seekerId && event.startsAt >= where.startsAt.gte && event.startsAt < where.startsAt.lt),
      findFirst: async ({ where }: { where: { id: string; application: { seekerId: string } } }) => events.find((event) => event.id === where.id && event.application.seekerId === where.application.seekerId) ?? null,
      create: async ({ data }: { data: { applicationId: string; kind: string; title: string; startsAt: Date; notes?: string | null } }) => {
        const event = { ...data, id: `event-${events.length + 1}`, notes: data.notes ?? null, application: { seekerId: "owner", job: { title: "Engineer", companyName: "Acme" } } };
        events.push(event);
        return event;
      },
      update: async ({ where, data }: { where: { id: string }; data: { title: string; startsAt: Date; kind: string; notes?: string | null } }) => {
        const event = events.find((entry) => entry.id === where.id)!;
        Object.assign(event, data);
        return event;
      },
      delete: async ({ where }: { where: { id: string } }) => { events.splice(events.findIndex((entry) => entry.id === where.id), 1); },
    },
  } } });
});

after(() => mock.restoreAll());

describe("local calendar API", () => {
  it("creates an application interview and retrieves it after a fresh request", async () => {
    const { GET, POST } = await import("../route");
    const saved = await POST(new Request("http://localhost/api/calendar/events", { method: "POST", body: JSON.stringify({ applicationId: "app-owner", kind: "INTERVIEW", title: "First interview", startsAt: "2026-11-18T10:00:00.000Z" }) }));
    assert.equal(saved.status, 201);
    const listed = await GET(new Request("http://localhost/api/calendar/events?month=2026-11"));
    assert.equal((await listed.json()).data[0].title, "First interview");
  });

  it("lets the owner reschedule and remove an event", async () => {
    const { PATCH, DELETE } = await import("../[id]/route");
    const context = { params: Promise.resolve({ id: "event-1" }) };
    assert.equal((await PATCH(new Request("http://localhost/api/calendar/events/event-1", { method: "PATCH", body: JSON.stringify({ kind: "DEADLINE", title: "Submit portfolio", startsAt: "2026-11-20T12:00:00.000Z" }) }), context)).status, 200);
    assert.equal(events[0].title, "Submit portfolio");
    assert.equal((await DELETE(new Request("http://localhost/api/calendar/events/event-1", { method: "DELETE" }), context)).status, 200);
    assert.equal(events.length, 0);
  });

  it("rejects another user's application and unauthenticated reads", async () => {
    const { GET, POST } = await import("../route");
    assert.equal((await POST(new Request("http://localhost/api/calendar/events", { method: "POST", body: JSON.stringify({ applicationId: "other", kind: "INTERVIEW", title: "Private", startsAt: "2026-11-18T10:00:00.000Z" }) }))).status, 404);
    userId = null;
    assert.equal((await GET(new Request("http://localhost/api/calendar/events?month=2026-11"))).status, 401);
    userId = "owner";
  });
});
