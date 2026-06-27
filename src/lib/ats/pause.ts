import { prisma } from '@/lib/prisma';

const PAUSE_KEY = 'ats:import:paused';

/*
 * isImportPaused
 * Returns true if the ATS import has been paused by an admin.
 * Defaults to false when the Setting row does not exist (fresh DB).
 */
export async function isImportPaused(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: PAUSE_KEY } });
  return setting?.value === 'true';
}

/*
 * setImportPaused
 * Toggles the ATS import pause flag in the DB.
 * @param paused - true to pause, false to resume
 */
export async function setImportPaused(paused: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: PAUSE_KEY },
    create: { key: PAUSE_KEY, value: String(paused) },
    update: { value: String(paused) },
  });
}
