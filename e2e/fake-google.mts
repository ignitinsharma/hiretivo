// A stand-in for Google (E15), started by playwright.config.ts. The app sends
// its sign-in, Gmail and Calendar requests to http://localhost:<port>/<host>
// (HIRETIVO_GOOGLE_TEST_BASE_URL), and this answers in Google's own shapes, so
// the app's real OAuth and MIME code runs end to end. The consent page agrees
// at once.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const port = Number(process.env.FAKE_GOOGLE_PORT ?? 3997);
/** The OAuth client a spec enters in Settings → Google. */
const CLIENT_ID = "e2e-google-client.apps.googleusercontent.com";
const CLIENT_SECRET = "e2e-google-secret";
const ACCESS_TOKEN = "e2e-access-token";
const ACCOUNT = "jane.doe@gmail.example";

let granted = "";
/** What the app sent: the raw message it built, its text and the attachments' names, for specs to check. */
const sent: { id: string; threadId: string; raw: string; text: string; attachments: string[] }[] = [];
type FakeEvent = {
  id: string;
  status: string;
  summary: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  extendedProperties?: { private?: Record<string, string> };
  htmlLink: string;
};
/** The calendar's events, by id; deleted ones stay, cancelled, as in Google. */
const events = new Map<string, FakeEvent>();
let eventCount = 0;
let revoked = 0;

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function read(request: IncomingMessage): Promise<string> {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw;
}

const base64url = (text: string) => Buffer.from(text, "utf8").toString("base64url");
/** An ID token with the account's address; the app reads it without checking the signature, as it may. */
const idToken = () => [base64url(JSON.stringify({ alg: "none" })), base64url(JSON.stringify({ email: ACCOUNT, email_verified: true })), "e2e"].join(".");

/** The text part of a raw message, decoded from base64. */
function textOf(raw: string): string {
  const part = raw.match(/Content-Type: text\/plain; charset=UTF-8\r?\nContent-Transfer-Encoding: base64\r?\n\r?\n([A-Za-z0-9+/=\r\n]+?)(\r?\n\r?\n|\r?\n--|$)/);
  return part ? Buffer.from(part[1].replace(/\s/g, ""), "base64").toString("utf8") : "";
}

function newEvent(): FakeEvent {
  eventCount += 1;
  const id = `e2e-event-${eventCount}`;
  return { id, status: "confirmed", summary: "", start: {}, end: {}, htmlLink: `https://calendar.google.com/calendar/event?eid=${id}` };
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const path = url.pathname;
  if (path === "/health") return send(response, 200, { ok: true });
  // For specs: what the app sent and did.
  if (path === "/state") return send(response, 200, { sent, events: [...events.values()].filter((event) => event.status !== "cancelled"), revoked, granted });

  // For specs: changes made "in Google Calendar".
  const testEvent = /^\/test\/events(?:\/([^/]+))?$/.exec(path);
  if (testEvent) {
    const event = testEvent[1] ? events.get(testEvent[1]) : undefined;
    if (request.method === "POST" && !testEvent[1]) {
      const added = { ...newEvent(), ...(JSON.parse(await read(request)) as Partial<FakeEvent>) };
      events.set(added.id, added);
      return send(response, 200, added);
    }
    if (!event) return send(response, 404, { error: "no such event" });
    if (request.method === "PATCH") Object.assign(event, JSON.parse(await read(request)) as Partial<FakeEvent>);
    if (request.method === "DELETE") event.status = "cancelled";
    return send(response, 200, event);
  }

  // Sign-in: the consent page agrees at once and sends the browser back.
  if (path === "/accounts/o/oauth2/v2/auth") {
    if (url.searchParams.get("client_id") !== CLIENT_ID) return send(response, 400, { error: "invalid_client" });
    granted = url.searchParams.get("scope") ?? "";
    const back = new URL(url.searchParams.get("redirect_uri") ?? "");
    back.searchParams.set("code", "e2e-code");
    back.searchParams.set("state", url.searchParams.get("state") ?? "");
    response.writeHead(302, { location: back.toString() });
    return response.end();
  }
  if (path === "/oauth2/token") {
    const form = new URLSearchParams(await read(request));
    if (form.get("client_id") !== CLIENT_ID || form.get("client_secret") !== CLIENT_SECRET) return send(response, 401, { error: "invalid_client" });
    if (form.get("grant_type") === "authorization_code") {
      if (form.get("code") !== "e2e-code") return send(response, 400, { error: "invalid_grant" });
      return send(response, 200, { access_token: ACCESS_TOKEN, expires_in: 3600, refresh_token: "e2e-refresh-token", scope: granted, id_token: idToken() });
    }
    if (form.get("refresh_token") !== "e2e-refresh-token") return send(response, 400, { error: "invalid_grant" });
    return send(response, 200, { access_token: ACCESS_TOKEN, expires_in: 3600, scope: granted });
  }
  if (path === "/oauth2/revoke") {
    revoked += 1;
    return send(response, 200, {});
  }

  if (request.headers.authorization !== `Bearer ${ACCESS_TOKEN}`) return send(response, 401, { error: { message: "Invalid credentials" } });

  // Gmail: sending only.
  const gmail = "/gmail/gmail/v1/users/me";
  if (path === `${gmail}/messages/send` && request.method === "POST") {
    const body = JSON.parse(await read(request)) as { raw: string; threadId?: string };
    const raw = Buffer.from(body.raw, "base64url").toString("utf8");
    const id = `sent-${sent.length + 1}`;
    const threadId = body.threadId ?? `thread-${sent.length + 1}`;
    sent.push({ id, threadId, raw, text: textOf(raw), attachments: [...raw.matchAll(/filename="([^"]+)"/g)].map((match) => match[1]) });
    return send(response, 200, { id, threadId, labelIds: ["SENT"] });
  }

  // Calendar: events are kept.
  const calendarEvent = /^\/www\/calendar\/v3\/calendars\/[^/]+\/events(?:\/([^/]+))?$/.exec(path);
  if (calendarEvent && !calendarEvent[1]) {
    if (request.method === "POST") {
      const added = { ...newEvent(), ...(JSON.parse(await read(request)) as Partial<FakeEvent>) };
      events.set(added.id, added);
      return send(response, 200, added);
    }
    // The events overlapping timeMin–timeMax, in order.
    const from = Date.parse(url.searchParams.get("timeMin") ?? "");
    const to = Date.parse(url.searchParams.get("timeMax") ?? "");
    const at = (time: FakeEvent["start"]) => Date.parse(time.dateTime ?? `${time.date}T00:00:00Z`);
    const items = [...events.values()].filter((event) => event.status !== "cancelled" && at(event.start) < to && at(event.end) > from).sort((a, b) => at(a.start) - at(b.start));
    return send(response, 200, { kind: "calendar#events", items });
  }
  if (calendarEvent) {
    const event = events.get(decodeURIComponent(calendarEvent[1]));
    if (!event) return send(response, 404, { error: { code: 404, message: "Not Found" } });
    if (request.method === "DELETE") {
      if (event.status === "cancelled") return send(response, 410, { error: { code: 410, message: "Resource has been deleted" } });
      event.status = "cancelled";
      response.writeHead(204);
      return response.end();
    }
    if (request.method === "PATCH") Object.assign(event, JSON.parse(await read(request)) as Partial<FakeEvent>);
    return send(response, 200, event);
  }

  send(response, 404, { error: { message: "Not found" } });
}).listen(port, "127.0.0.1", () => console.log(`Fake Google on http://localhost:${port}`));
