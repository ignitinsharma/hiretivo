import { sendEmail } from '@/lib/resend';

export interface DigestJob {
  id: string;
  title: string;
  companyName: string;
  matchScore: number;
}

export async function sendSeekerDigest(
  to: string,
  seekerName: string | null,
  jobs: DigestJob[]
): Promise<{ id: string }> {
  const jobsHtml = jobs
    .map(
      (job) => `
      <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #1f2937;">${job.title}</div>
        <div style="color: #6b7280; font-size: 14px;">${job.companyName}</div>
        <div style="color: #059669; font-size: 14px; margin-top: 4px;">${job.matchScore}% match</div>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Your Weekly Job Matches</h1>
        <p style="color: #4b5563;">Hi ${seekerName ?? 'there'},</p>
        <p style="color: #4b5563;">Here are your top matched jobs from this week:</p>
        <div style="margin-top: 20px;">
          ${jobsHtml || '<p style="color: #6b7280;">No new matches this week. Keep your profile updated to get better recommendations!</p>'}
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hiretivo.com'}/seeker/dashboard" style="color: #4f46e5; text-decoration: none;">View all matches →</a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          You received this email because you opted into weekly job digests. 
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hiretivo.com'}/seeker/settings" style="color: #9ca3af;">Manage preferences</a>
        </p>
      </body>
    </html>
  `;

  const text = jobs.length
    ? `Your Weekly Job Matches\n\n${jobs.map((j) => `- ${j.title} at ${j.companyName} (${j.matchScore}% match)`).join('\n')}\n\nView all: ${process.env.NEXT_PUBLIC_APP_URL || 'https://hiretivo.com'}/seeker/dashboard`
    : `Your Weekly Job Matches\n\nNo new matches this week. Keep your profile updated to get better recommendations!\n\nView all: ${process.env.NEXT_PUBLIC_APP_URL || 'https://hiretivo.com'}/seeker/dashboard`;

  return sendEmail({
    from: 'Hiretivo <notifications@hiretivo.com>',
    to,
    subject: 'Your Weekly Job Matches',
    html,
    text,
  });
}