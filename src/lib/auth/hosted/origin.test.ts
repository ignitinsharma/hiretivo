import { describe, expect, it } from "vitest";
import { isLocalDevelopmentOrigin } from "./origin";

describe("local hosted origins", () => {
  it("allows HTTP loopback only during development", () => {
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
      expect(isLocalDevelopmentOrigin(origin, "development")).toBe(true);
      expect(isLocalDevelopmentOrigin(origin, "production")).toBe(false);
    }
  });
  it("never relaxes cookies for public hosts or malformed origins", () => {
    for (const origin of ["http://hiretivo.com", "http://localhost.evil.test", "http://localhost:3000/path", "http://user:pass@localhost", "http://localhost?x=1", "https://hiretivo.com", "bad"]) {
      expect(isLocalDevelopmentOrigin(origin, "development")).toBe(false);
    }
  });
});
