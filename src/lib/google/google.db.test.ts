import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestClient, resetDatabase } from "@/test/db";

// Send with Gmail (E15-2) against a test database, with Google's send API
// answered by a fake fetch.

const db = vi.hoisted(() => ({ client: undefined as ReturnType<typeof createTestClient> | undefined }));
vi.mock("@/lib/prisma", async () => {
  const { createTestClient } = await import("@/test/db");
  db.client = createTestClient();
  return { prisma: db.client };
});
vi.mock("@/lib/env", () => ({
  env: { HIRETIVO_SECRET: "s".repeat(40), HIRETIVO_GOOGLE_CLIENT_ID: "client", HIRETIVO_GOOGLE_CLIENT_SECRET: "secret", HIRETIVO_DATA_DIR: "/tmp" },
}));
vi.mock("@/lib/pdf/render", () => ({ renderPdf: async () => new Uint8Array([37, 80, 68, 70]) }));

import { encryptSecret, GOOGLE_TOKEN } from "@/lib/secrets";

import { sendApplicationEmail } from "./send";

const prisma = () => db.client!;

let sent: { raw: string; threadId?: string }[] = [];

function fakeGoogle(url: string, init?: RequestInit): Response {
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  const path = new URL(url).pathname;
  if (url.startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "access", expires_in: 3600, scope: "" });
  if (path.endsWith("/messages/send")) {
    const body = JSON.parse(String(init?.body)) as { raw: string; threadId?: string };
    sent.push(body);
    return json({ id: `sent-${sent.length}`, threadId: body.threadId ?? "thread-new" });
  }
  return new Response("not found", { status: 404 });
}

const scopes = "openid email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events";

beforeEach(async () => {
  await resetDatabase(prisma());
  sent = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init?: RequestInit) => fakeGoogle(String(url), init)));
  await prisma().googleAccount.create({ data: { email: "jane@gmail.com", refreshTokenEnc: encryptSecret(GOOGLE_TOKEN, "refresh", "s".repeat(40)), scopes } });
  await prisma().profileField.create({ data: { key: "name", value: "Jane Doe" } });
  await prisma().application.create({
    data: {
      id: "nw",
      company: "Northwind Logistics",
      role: "Product Designer",
      status: "DRAFT",
      postingText: "Apply to careers@northwind.example.",
      documents: {
        create: [
          { kind: "EMAIL", units: [{ id: "to", label: "Recipient", text: "careers@northwind.example" }, { id: "subject", label: "Subject", text: "Application: Product Designer" }, { id: "body", label: "Message", text: "Dear team,\n\nI'm applying.\n\nJane" }] },
          { kind: "RESUME", units: [] },
        ],
      },
    },
  });
});

afterEach(() => vi.unstubAllGlobals());
afterAll(async () => prisma().$disconnect());

describe("Send with Gmail (E15-2)", () => {
  it("sends with the PDFs, keeps the thread and moves the draft to Sent", async () => {
    const result = await sendApplicationEmail("nw");
    expect(result.eventId).not.toBeNull();
    expect(result.attachments).toHaveLength(1);
    const raw = Buffer.from(sent[0].raw, "base64url").toString("utf8");
    expect(raw).toContain("From: Jane Doe <jane@gmail.com>");
    expect(raw).toContain("To: careers@northwind.example");
    expect(raw).toContain("application/pdf");
    const application = await prisma().application.findUniqueOrThrow({ where: { id: "nw" } });
    expect(application).toMatchObject({ status: "SENT", emailThreadId: "thread-new" });
  });
});
