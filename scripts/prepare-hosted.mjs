import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";

/** Ensure shared auth tables exist before instrumentation reads hosted accounts. */
export async function prepareHostedStartup(mode, migrate) {
  if (mode === undefined || mode === "self-hosted") return;
  if (mode !== "hosted") throw new Error("HIRETIVO_DEPLOYMENT_MODE must be self-hosted or hosted.");
  await migrate();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    // Match Next's .env.local and development/production file precedence.
    nextEnv.loadEnvConfig(process.cwd(), !process.argv.includes("--production"));
    await prepareHostedStartup(process.env.HIRETIVO_DEPLOYMENT_MODE, () => import("./hosted-auth-migrate.mjs"));
  } catch (error) {
    console.error(`Hiretivo could not prepare the hosted database (${error.code ?? error.name}). Run yarn hosted:migrate to inspect the migration failure.`);
    process.exitCode = 1;
  }
}
