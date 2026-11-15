import { describe, expect, it } from "vitest";

import { deploymentMode } from "./deployment-mode";

describe("deployment mode", () => {
  it("supports explicit private and hosted installations", () => {
    expect(deploymentMode("self-hosted")).toBe("self-hosted");
    expect(deploymentMode("hosted")).toBe("hosted");
  });

  it("rejects misspelled modes instead of enabling a different authentication flow", () => {
    expect(() => deploymentMode("hostedd")).toThrow("HIRETIVO_DEPLOYMENT_MODE");
    expect(() => deploymentMode("")).toThrow("HIRETIVO_DEPLOYMENT_MODE");
  });
});
