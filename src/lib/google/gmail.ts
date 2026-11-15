import "server-only";

import { googleFetch } from "./account";
import { googleUrl } from "./endpoints";
import { buildMessage, toBase64Url, type OutgoingMail } from "./mime";

// The parts of the Gmail API Hiretivo uses (E15-2): sending an application,
// and nothing read from the mailbox.

const api = (path: string) => googleUrl("gmail", `/gmail/v1/users/me${path}`);

/** Sends a message; with `threadId` it joins that thread. */
export async function sendMail(mail: OutgoingMail, { threadId }: { threadId?: string } = {}): Promise<{ id: string; threadId: string }> {
  const raw = toBase64Url(buildMessage(mail));
  const sent = await googleFetch<{ id: string; threadId: string }>("send", api("/messages/send"), {
    method: "POST",
    body: threadId ? { raw, threadId } : { raw },
  });
  return { id: sent.id, threadId: sent.threadId };
}
