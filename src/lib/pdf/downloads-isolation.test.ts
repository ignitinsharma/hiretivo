import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/deployment-mode", () => ({ deploymentMode: () => "hosted" }));

import { heldPdf, holdPdf } from "./downloads";

describe("hosted PDF ownership", () => {
  it("refuses another account even when it knows the download id", () => {
    const id = holdPdf(new Uint8Array([37, 80, 68, 70]), "Alice private resume.pdf", 1000, "alice");
    expect(heldPdf(id, 1001, "alice")).not.toBeNull();
    expect(heldPdf(id, 1001, "bob")).toBeNull();
    expect(() => heldPdf(id, 1001)).toThrow("requires an account");
  });

  it("refuses unowned PDF creation", () => {
    expect(() => holdPdf(new Uint8Array(), "private.pdf")).toThrow("requires an account");
  });
});
