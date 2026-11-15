import "server-only";

import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildExport } from "@/lib/data-export";
import { tenantDataDir } from "@/lib/tenancy/files";
import { prisma } from "@/lib/prisma";

// Backups (E10-6, E10-7): exports written to HIRETIVO_DATA_DIR/backups. They
// never hold the API key in plain text.

export type BackupReason = "before-import" | "nightly";

export const backupsDir = () => tenantDataDir("backups");

const pad = (value: number) => String(value).padStart(2, "0");

/** "hiretivo-backup-nightly-2026-09-28-030000.json", in the server's time zone. */
export function backupFileName(reason: BackupReason, now: Date): string {
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `hiretivo-backup-${reason}-${day}-${time}.json`;
}

/** Writes an export of everything to the backups folder; returns the file's name. */
export async function writeBackup(reason: BackupReason, now = new Date()): Promise<string> {
  const data = await buildExport(prisma, { now });
  await mkdir(await backupsDir(), { recursive: true });
  const name = backupFileName(reason, now);
  await writeFile(path.join(await backupsDir(), name), JSON.stringify(data, null, 2));
  return name;
}

/** The backup files, newest first. */
export async function listBackups(): Promise<{ name: string; modified: Date }[]> {
  const names = (await readdir(await backupsDir()).catch(() => [])).filter((name) => /^hiretivo-backup-.*\.json$/.test(name));
  const files = await Promise.all(names.map(async (name) => ({ name, modified: (await stat(path.join(await backupsDir(), name))).mtime })));
  return files.sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

/** Deletes every backup file (Delete everything, E10-8). */
export async function deleteAllBackups(): Promise<void> {
  await rm(await backupsDir(), { recursive: true, force: true });
}
