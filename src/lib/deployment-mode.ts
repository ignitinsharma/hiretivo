/** Explicit deployment mode; never infer public registration from the hostname. */
export type DeploymentMode = "self-hosted" | "hosted";

export function deploymentMode(value = process.env.HIRETIVO_DEPLOYMENT_MODE): DeploymentMode {
  if (value === undefined || value === "self-hosted") return "self-hosted";
  if (value === "hosted") return "hosted";
  throw new Error("HIRETIVO_DEPLOYMENT_MODE must be self-hosted or hosted.");
}
