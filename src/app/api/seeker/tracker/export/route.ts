import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { resolveApplicationCompany } from "@/lib/applications/resolve-application-company";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { trackerExportRateLimiter } from "@/lib/rate-limit";

const CSV_HEADER = ["Company", "Role", "Status", "Applied Date", "Notes", "Job URL"];

/*
 * GET /api/seeker/tracker/export
 * Downloads every seeker Application (not passed/DismissedJob rows — those
 * were never actually applied to) as a CSV: Company, Role, Status, Applied
 * Date, Notes, Job URL. Status is the raw ApplicationStatus value (not the
 * tracker's collapsed column label) so a later CSV import round-trips
 * exactly. Rate-limited 5/min per user (Section F3).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await trackerExportRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const applications = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: {
      status: true,
      notes: true,
      externalJobUrl: true,
      externalTitle: true,
      externalCompanyName: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          isAdminPosted: true,
          companyName: true,
          companyLogoUrl: true,
          externalApplyUrl: true,
          recruiter: { select: { recruiterProfile: { select: { companyName: true, logo: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = applications.map((app) => {
    const { companyName } = resolveApplicationCompany(app);
    return [
      companyName,
      app.job?.title ?? app.externalTitle ?? "Untitled role",
      app.status,
      app.createdAt.toISOString().slice(0, 10),
      app.notes,
      app.job?.externalApplyUrl ?? app.externalJobUrl,
    ];
  });

  const csv = buildCsv(CSV_HEADER, rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hiretivo-tracker-export.csv"`,
    },
  });
}
