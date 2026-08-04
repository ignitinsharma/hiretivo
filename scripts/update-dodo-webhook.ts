/**
 * update-dodo-webhook
 *
 * Points the "local-dev-tunnel" Dodo webhook endpoint at the given URL.
 * Quick tunnel URLs rotate on every restart, so dev-with-tunnel.sh calls
 * this after starting the tunnel to keep the endpoint in sync.
 *
 * Usage: pnpm exec tsx scripts/update-dodo-webhook.ts <public-https-url>
 */

import { dodo } from "../src/lib/dodo";
import { readFile, writeFile } from "node:fs/promises";
import type { WebhookEventType } from "dodopayments/resources/webhook-events";

const WEBHOOK_DESCRIPTION = "local-dev-tunnel";
const FILTER_TYPES: WebhookEventType[] = [
  "subscription.active",
  "subscription.cancelled",
  "subscription.expired",
  "subscription.failed",
  "subscription.on_hold",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.updated",
  "payment.failed",
  "payment.succeeded",
];

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: update-dodo-webhook.ts <public-https-url>");
    process.exit(1);
  }
  const webhookUrl = `${url.replace(/\/$/, "")}/api/billing/webhook`;

  const webhooks = await dodo.webhooks.list();
  const existing = (webhooks.data ?? []).find(
    (w) => w.description === WEBHOOK_DESCRIPTION,
  );

  if (existing) {
    await dodo.webhooks.update(existing.id, { url: webhookUrl });
    console.log(`Updated webhook ${existing.id} -> ${webhookUrl}`);
  } else {
    const created = await dodo.webhooks.create({
      url: webhookUrl,
      description: WEBHOOK_DESCRIPTION,
      filter_types: FILTER_TYPES,
    });
    console.log(`Created webhook ${created.id} -> ${webhookUrl}`);

    const { secret } = await dodo.webhooks.retrieveSecret(created.id);
    await writeLocalWebhookSecret(secret);
  }
}

async function writeLocalWebhookSecret(secret: string): Promise<void> {
  const envFile = ".env.local";
  const content = await readFile(envFile, "utf8");
  const updated = content.replace(
    /^DODO_WEBHOOK_SECRET=.*$/m,
    `DODO_WEBHOOK_SECRET="${secret}"`,
  );
  if (updated === content) {
    console.error(`DODO_WEBHOOK_SECRET not found in ${envFile} — add it manually`);
    process.exit(1);
  }
  await writeFile(envFile, updated);
  console.log("DODO_WEBHOOK_SECRET in .env.local updated to match the new endpoint");
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
