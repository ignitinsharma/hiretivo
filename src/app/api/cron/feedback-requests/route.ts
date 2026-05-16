import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signFeedbackToken, hashToken } from "@/lib/feedback-token";
import { sendEmail } from "@/lib/resend";
import { ApplicationStatus } from "@/constants/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET ?? "local-dev-secret";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Hiretivo <noreply@hiretivo.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/*
 * GET /api/cron/feedback-requests
 * Daily cron (08:00 UTC) — creates FeedbackRequest records for HIRED
 * applications where updatedAt (when status=HIRED) is 90+ days ago
 * and no FeedbackRequest exists yet for the same engineer+job pair.
 * Auth: Bearer ${CRON_SECRET} header required.
 * Returns: { created: number } — count of new FeedbackRequest records created.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Collect existing (engineerId, jobId) pairs to avoid duplicates
    // Application has @@unique([jobId, seekerId]) so one app per job+engineer
    const existingRequests = await prisma.feedbackRequest.findMany({
      select: { engineerId: true, jobId: true },
    });
    const existingKeys = new Set(
      existingRequests.map((r) => `${r.engineerId}:${r.jobId}`)
    );

    // Find HIRED applications 90+ days old without a FeedbackRequest yet
    const hiredApps = await prisma.application.findMany({
      where: {
        status: ApplicationStatus.HIRED,
        updatedAt: { lte: cutoff },
      },
      include: {
        job: {
          select: {
            recruiterId: true,
            title: true,
            recruiter: { select: { name: true, email: true } },
          },
        },
        seeker: { select: { name: true } },
      },
      take: 100,
    });

    // Filter out apps that already have a FeedbackRequest (matched by engineerId + jobId)
    const newApps = hiredApps.filter(
      (app) => !existingKeys.has(`${app.seekerId}:${app.jobId}`)
    );

    let created = 0;

    for (const app of newApps) {
      const recruiter = app.job.recruiter;
      const engineerName = app.seeker.name ?? "your hire";

      // Create FeedbackRequest with placeholder tokenHash — will be updated after signing
      const record = await prisma.feedbackRequest.create({
        data: {
          engineerId: app.seekerId,
          recruiterId: app.job.recruiterId,
          jobId: app.jobId,
          tokenHash: "pending",
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });

      // Sign JWT with real feedbackRequestId, then store hash
      const token = await signFeedbackToken({
        engineerId: app.seekerId,
        recruiterId: app.job.recruiterId,
        jobId: app.jobId,
        feedbackRequestId: record.id,
      });
      const tokenHash = hashToken(token);

      await prisma.feedbackRequest.update({
        where: { id: record.id },
        data: { tokenHash },
      });

      // Send feedback request email to recruiter
      if (recruiter.email) {
        const feedbackUrl = `${APP_URL}/feedback/${token}`;
        try {
          await sendEmail({
            from: FROM_EMAIL,
            to: recruiter.email,
            subject: `How did ${engineerName} do?`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <p style="color:#0a0a0a;font-size:16px;line-height:1.6;margin:0 0 16px;">
                  Hi ${recruiter.name ?? "there"},
                </p>
                <h2 style="color:#0a0a0a;font-size:20px;font-weight:600;margin:0 0 16px;">
                  Feedback Request: ${engineerName}
                </h2>
                <p style="color:#6b7280;font-size:16px;line-height:1.6;margin:0 0 16px;">
                  You hired <strong>${engineerName}</strong> for the role <strong>${app.job.title}</strong> about 90 days ago.
                  Please take a moment to share your feedback on their performance.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${feedbackUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                    Leave Feedback
                  </a>
                </p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 8px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="word-break:break-all;font-size:14px;line-height:1.6;margin:0 0 16px;">
                  <a href="${feedbackUrl}" style="color:#7560ff;text-decoration:underline;">${feedbackUrl}</a>
                </p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
                  This link expires in 90 days. Your feedback helps us improve Hiretivo Score accuracy.
                </p>
              </div>
            `,
            text: `Hi ${recruiter.name ?? "there"},\n\nYou hired ${engineerName} for ${app.job.title} about 90 days ago. Please share feedback on their performance:\n\n${feedbackUrl}\n\nThis link expires in 90 days. Your feedback helps us improve Hiretivo Score accuracy.`,
          });
        } catch (err) {
          console.error(
            `[feedback-requests] Failed to send email for app ${app.id}:`,
            err
          );
        }
      }

      created++;
    }

    return NextResponse.json({ created });
  } catch (err) {
    console.error("[feedback-requests] Cron failed:", err);
    return NextResponse.json({ error: "cron failed" }, { status: 500 });
  }
}
