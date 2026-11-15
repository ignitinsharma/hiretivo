import "server-only";

import path from "node:path";

import { deploymentMode } from "@/lib/deployment-mode";
import { env } from "@/lib/env";
import { currentTenantId, tenantSchema } from "./context";

/** No account's downloads/backups share a directory with another account. */
export async function tenantDataDir(folder: "backups" | "downloads"): Promise<string> {
  if (deploymentMode() === "self-hosted") return path.join(env.HIRETIVO_DATA_DIR, folder);
  return path.join(env.HIRETIVO_DATA_DIR, "accounts", tenantSchema(await currentTenantId()), folder);
}
