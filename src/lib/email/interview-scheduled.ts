import { resend } from "@/lib/resend";
import { formatInterviewTimezoneDisplay } from "@/lib/timezone";

const FROM_EMAIL = "Hiretivo <noreply@hiretivo.com>";

interface SendInterviewScheduledEmailInput {
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  companyName: string;
  startsAt: Date;
  endsAt: Date;
  meetLink?: string | null;
  notes?: string | null;
  scheduledTimeZone?: string | null;
  viewerTimezone?: string | null;
}

function formatDuration(startsAt: Date, endsAt: Date): string {
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  return `${minutes} min`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendInterviewScheduledEmail(
  input: SendInterviewScheduledEmailInput,
): Promise<void> {
  if (!input.seekerEmail) {
    return;
  }

  const seekerName = escapeHtml(input.seekerName);
  const jobTitle = escapeHtml(input.jobTitle);
  const companyName = escapeHtml(input.companyName);
  const startsAt = formatInterviewTimezoneDisplay(
    input.startsAt,
    input.scheduledTimeZone,
    input.viewerTimezone,
  );
  const endsAt = formatInterviewTimezoneDisplay(
    input.endsAt,
    input.scheduledTimeZone,
    input.viewerTimezone,
  );
  const duration = formatDuration(input.startsAt, input.endsAt);
  const meetLink = input.meetLink?.trim();
  const notes = input.notes?.trim();

  const meetSection = meetLink
    ? `<p><strong>Join meeting:</strong> <a href="${escapeHtml(meetLink)}">${escapeHtml(meetLink)}</a></p>`
    : "<p><em>The recruiter has not added a meeting link yet.</em></p>";
  const notesSection = notes
    ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>`
    : "";

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0e0f0c;">
      <h2>Interview scheduled</h2>
      <p>Hi ${seekerName},</p>
      <p>${companyName} scheduled an interview with you for <strong>${jobTitle}</strong>.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;">
        <p><strong>Scheduled start:</strong> ${escapeHtml(startsAt.scheduled)}</p>
        <p><strong>Your start:</strong> ${escapeHtml(startsAt.viewer)}</p>
        <p><strong>Scheduled end:</strong> ${escapeHtml(endsAt.scheduled)}</p>
        <p><strong>Your end:</strong> ${escapeHtml(endsAt.viewer)}</p>
      </div>
      <p><strong>Duration:</strong> ${duration}</p>
      ${meetSection}
      ${notesSection}
    </div>
  `;

  const text = [
    `Hi ${input.seekerName},`,
    `${input.companyName} scheduled an interview with you for ${input.jobTitle}.`,
    `Scheduled start: ${startsAt.scheduled}`,
    `Your start: ${startsAt.viewer}`,
    `Scheduled end: ${endsAt.scheduled}`,
    `Your end: ${endsAt.viewer}`,
    `Duration: ${duration}`,
    meetLink ? `Join meeting: ${meetLink}` : "The recruiter has not added a meeting link yet.",
    notes ? `Notes: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.seekerEmail,
    subject: `Interview scheduled: ${input.jobTitle} at ${input.companyName}`,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }
}
