import { ContactRequestType } from "@/constants/enums";
import { sendEmail } from "@/lib/resend";
import type { ContactSupportInput } from "@/lib/validations/contact.schema";

const SUPPORT_EMAIL = "hiretivo@gmail.com";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Hiretivo Support <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOptionalValue(value: string | undefined): string {
  return value?.trim() ? value.trim() : "Not provided";
}

function getRequestTypeLabel(type: ContactRequestType): string {
  return type === ContactRequestType.BOOK_CALL ? "Book a call" : "Contact";
}

export async function sendContactSupportEmail(
  input: ContactSupportInput,
): Promise<void> {
  const requestType = getRequestTypeLabel(input.type);
  const subject =
    input.subject?.trim() || `${requestType} request from ${input.name}`;
  const companyOrRole = formatOptionalValue(input.companyOrRole);
  const preferredTime = formatOptionalValue(input.preferredTime);

  const text = [
    `Request type: ${requestType}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company/role: ${companyOrRole}`,
    `Preferred time: ${preferredTime}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const rows = [
    ["Request type", requestType],
    ["Name", input.name],
    ["Email", input.email],
    ["Company/role", companyOrRole],
    ["Preferred time", preferredTime],
    ["Subject", subject],
  ];

  await sendEmail({
    from: FROM_EMAIL,
    to: SUPPORT_EMAIL,
    subject: `Hiretivo support: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2>New Hiretivo support request</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 140px;">${escapeHtml(label)}</td>
                    <td style="padding: 8px 0; color: #0a0a0a;">${escapeHtml(value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
        <div style="margin-top: 24px;">
          <p style="color: #6b7280; margin-bottom: 8px;">Message</p>
          <p style="white-space: pre-wrap; color: #0a0a0a;">${escapeHtml(input.message)}</p>
        </div>
      </div>
    `,
    text,
  });
}
