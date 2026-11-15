import "server-only";

import { env } from "@/lib/env";
import { createEmailToken, type TokenPurpose } from "./store";

export function authPublicUrl(): string {
  const url = env.HIRETIVO_PUBLIC_URL;
  if (!url) throw new Error("HIRETIVO_PUBLIC_URL is required for hosted authentication.");
  return url;
}
export async function sendAccountEmail(userId: string, email: string, purpose: TokenPurpose): Promise<void> {
  const token = await createEmailToken(userId, purpose);
  const path = purpose === "verify" ? "/verify-email" : "/reset-password";
  const url = `${authPublicUrl()}${path}?token=${encodeURIComponent(token)}`;
  const title = purpose === "verify" ? "Verify your Hiretivo account" : "Reset your Hiretivo password";
  const button = purpose === "verify" ? "Verify email" : "Reset password";
  const expiry = purpose === "verify" ? "24 hours" : "30 minutes";
  const escaped = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: title,
      text: `Hi there,\n\n${title}: ${url}\n\nThis link expires in ${expiry}. If you did not request this email, you can ignore it.`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;color:#16241b"><p>Hi there,</p><h2>${title}</h2><p><a href="${escaped}" style="display:inline-block;padding:12px 24px;background:#1f3d2b;color:white;border-radius:8px;text-decoration:none">${button}</a></p><p>Or open this address:</p><p style="word-break:break-all"><a href="${escaped}">${escaped}</a></p><p>This link expires in ${expiry}. If you did not request this email, you can ignore it.</p></div>`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Verification email could not be delivered.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string" || !result.id) throw new Error("Email delivery did not return a message ID.");
}
