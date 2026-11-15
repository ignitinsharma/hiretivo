"use server";

import { z } from "zod";

import { action, ActionError } from "@/lib/action";

import { prisma } from "@/lib/prisma";
import { withCreationLock } from "./creation-lock";
import { cancelJob, retryJob } from "./runner";

/** Runs a failed job again (E6-7): same job, same input, so nothing is duplicated. */
export const retry = action(z.object({ id: z.string().min(1) }), async ({ id }) => withCreationLock(async () => {
  const job = await prisma.job.findUnique({ where: { id }, select: { type: true } });
  if (job?.type === "automatic-application" && await prisma.job.findFirst({ where: { type: "automatic-application", status: { in: ["RUNNING", "QUEUED"] }, id: { not: id } } })) throw new ActionError("Another application is being prepared. Wait for it to finish before retrying.");
  if (!(await retryJob(id))) throw new ActionError("This can't be retried: it's still running or already done.");
  return null;
}));

/** Stops a queued or running job. */
export const cancel = action(z.object({ id: z.string().min(1) }), async ({ id }) => {
  await cancelJob(id);
  return null;
});
