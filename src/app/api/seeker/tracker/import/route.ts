import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { APPLICATION_STATUS_VALUES, ApplicationStatus, UserRole } from "@/constants/enums";
import { createManualApplication, loadExistingApplicationDedupKeys } from "@/lib/applications/create-manual-application";
import { parseCsv } from "@/lib/csv";
import { trackerImportRateLimiter } from "@/lib/rate-limit";

const MAX_CSV_LENGTH = 1_000_000; // ~1MB of UTF-16 chars, per plan's edge case

const importBodySchema = z.object({ csv: z.string().max(MAX_CSV_LENGTH) });

interface ImportRowError {
  row: number;
  reason: string;
}

/* parseStatus — case-insensitive match against ApplicationStatus; blank defaults to APPLIED. */
function parseStatus(raw: string): ApplicationStatus | null {
  const upper = raw.trim().toUpperCase();
  if (!upper) return ApplicationStatus.APPLIED;
  return (APPLICATION_STATUS_VALUES as readonly string[]).includes(upper) ? (upper as ApplicationStatus) : null;
}

/* parseAppliedDate — blank -> null (defaults to now at create time), unparseable -> "invalid". */
function parseAppliedDate(raw: string): Date | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

/*
 * POST /api/seeker/tracker/import
 * Parses a CSV body (same 6-column shape as GET .../export: Company, Role,
 * Status, Applied Date, Notes, Job URL) and creates one ApplySource.MANUAL
 * Application per valid row. Dedups by company+role or Job URL against both
 * the seeker's existing applications AND rows already inserted earlier in
 * this same import (create-manual-application.ts mutates the dedup sets in
 * place) — duplicates count toward `skipped`, malformed rows go to `errors`
 * with a 1-indexed row number (row 1 = header, so first data row is 2,
 * matching what a spreadsheet app would show). Rows are inserted
 * sequentially, not in parallel — the in-memory dedup sets must observe
 * each insert before the next row's duplicate check runs, and import
 * volumes (a personal tracker's CSV) are far too small for this to matter
 * for latency. Rate-limited 3/min per user (Section F3).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await trackerImportRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsedBody = importBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 });
  }

  const allRows = parseCsv(parsedBody.data.csv);
  const dataRows = allRows.slice(1); // row 0 is the header

  const seekerId = session.user.id;
  const existingKeys = await loadExistingApplicationDedupKeys(seekerId);

  let created = 0;
  let skipped = 0;
  const errors: ImportRowError[] = [];

  for (let i = 0; i < dataRows.length; i += 1) {
    const rowNumber = i + 2;
    const cols = dataRows[i];

    const companyName = (cols[0] ?? "").trim();
    const jobTitle = (cols[1] ?? "").trim();
    if (!companyName || !jobTitle) {
      errors.push({ row: rowNumber, reason: "Company and Role are required" });
      continue;
    }

    const statusRaw = cols[2] ?? "";
    const status = parseStatus(statusRaw);
    if (status === null) {
      errors.push({ row: rowNumber, reason: `Unrecognized status "${statusRaw}"` });
      continue;
    }

    const dateRaw = cols[3] ?? "";
    const appliedAt = parseAppliedDate(dateRaw);
    if (appliedAt === "invalid") {
      errors.push({ row: rowNumber, reason: `Unrecognized date "${dateRaw}"` });
      continue;
    }

    const notes = (cols[4] ?? "").trim();
    const externalJobUrl = (cols[5] ?? "").trim();
    if (externalJobUrl && !/^https?:\/\//i.test(externalJobUrl)) {
      errors.push({ row: rowNumber, reason: `Invalid job URL "${externalJobUrl}"` });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop -- sequential by design, see docstring
    const result = await createManualApplication(
      seekerId,
      {
        companyName,
        jobTitle,
        status,
        appliedAt: appliedAt ?? undefined,
        notes: notes || undefined,
        externalJobUrl: externalJobUrl || undefined,
      },
      existingKeys,
    );

    if (result.outcome === "duplicate") {
      skipped += 1;
    } else {
      created += 1;
    }
  }

  return NextResponse.json({ data: { created, skipped, errors } }, { status: 200 });
}
