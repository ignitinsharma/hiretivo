// Next.js calls register() once when a server starts, before it handles any
// request. It doesn't run during `next build`, so the build needs no secrets.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvOnStartup } = await import("@/lib/env");
    checkEnvOnStartup();

    // Serverless instances can start while other instances are processing jobs.
    // Release migrations and scheduled maintenance run outside instance startup.
    if (process.env.VERCEL === "1" && process.env.HIRETIVO_DEPLOYMENT_MODE === "hosted") return;

    const { logServerError } = await import("@/lib/log");
    const { deploymentMode } = await import("@/lib/deployment-mode");
    const { eachTenant, upgradeAllTenants, startAuthCleanup } = await import("@/lib/tenancy/provision");
    const hosted = deploymentMode() === "hosted";
    // Refuse startup on a failed account migration rather than run mixed schemas.
    if (hosted) {
      await upgradeAllTenants();
      startAuthCleanup();
    }

    // A restart lifts a block on sign-ins from new browsers (#334).
    const { liftBlockOnEveryone } = await import("@/lib/auth/login-throttle");
    const { prisma } = await import("@/lib/prisma");
    if (!hosted) await liftBlockOnEveryone(prisma).catch((error: unknown) => logServerError("startup", error));

    // AI jobs left running by the previous process can't finish (E6-7).
    const { recoverInterruptedJobs } = await import("@/lib/jobs/runner");
    await eachTenant(() => recoverInterruptedJobs()).catch((error: unknown) => logServerError("startup", error));

    // Applications sent before 1.12 keep what they show now (#299).
    const { freezeSentApplications } = await import("@/lib/frozen-copy");
    await eachTenant(() => freezeSentApplications()).catch((error: unknown) => logServerError("startup", error));

    // Finished jobs, with what they were given and wrote, are deleted after a while.
    const { startJobSweep } = await import("@/lib/jobs/retention");
    startJobSweep();

    // Nightly backups at 03:00, while they're switched on (E10-7).
    const { startBackupSchedule } = await import("@/lib/backup-schedule");
    startBackupSchedule();

    // The job agent's daily run, while it's on (E16-4).
    const { startAgentSchedule } = await import("@/lib/agent/schedule");
    startAgentSchedule();

    // Startups' daily refresh, once it was refreshed by hand and while the screen is in use (#222).
    const { startStartupsSchedule } = await import("@/lib/startups/schedule");
    startStartupsSchedule();

    // HIRETIVO_JOBS_SOURCE=arbeitsagentur: the log says what that choice means (#223).
    const { arbeitsagenturStartupNotice, loadJobSearchConfig } = await import("@/lib/job-search/config");
    try {
      const notice = hosted ? null : arbeitsagenturStartupNotice(await loadJobSearchConfig());
      if (notice) console.log(notice);
    } catch (error) {
      logServerError("job search", error);
    }
  }
}
