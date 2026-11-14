import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { prepareHostedStartup } from "../../../../scripts/prepare-hosted.mjs";

describe("fresh hosted database startup", () => {
  it("creates shared identity tables before instrumentation reads accounts", async () => {
    const database = { hasHostedUser: false };
    await prepareHostedStartup("hosted", async () => { database.hasHostedUser = true; });
    const upgradeAccounts = () => {
      if (!database.hasHostedUser) throw new Error('relation "public.HostedUser" does not exist');
    };
    expect(upgradeAccounts).not.toThrow();
  });

  it("stops startup if shared schema preparation fails", async () => {
    await expect(prepareHostedStartup("hosted", async () => { throw new Error("database unavailable"); })).rejects.toThrow("database unavailable");
  });

  it("leaves self-hosted databases alone and rejects invalid modes", async () => {
    const migrate = vi.fn();
    await prepareHostedStartup(undefined, migrate);
    await prepareHostedStartup("self-hosted", migrate);
    expect(migrate).not.toHaveBeenCalled();
    await expect(prepareHostedStartup("normal", migrate)).rejects.toThrow("HIRETIVO_DEPLOYMENT_MODE");
  });

  it("runs preparation before both direct Next startup commands", () => {
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(scripts.dev).toBe("node scripts/prepare-hosted.mjs && next dev");
    expect(scripts.start).toBe("node scripts/prepare-hosted.mjs --production && next start");
  });
});
