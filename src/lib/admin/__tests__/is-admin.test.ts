import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import { isAdminSession } from "../is-admin";

import type { Session } from "next-auth";

/*
 * Helper to build a minimal Session object for testing.
 */
function makeSession(email: string | null | undefined): Session {
  return {
    user: { email: email ?? undefined, name: "Test User", id: "user-1" },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}

describe("isAdminSession", () => {
  const originalEnv = process.env.ADMIN_EMAIL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = originalEnv;
    }
  });

  it("returns false when session is null", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    assert.equal(isAdminSession(null), false);
  });

  it("returns false when ADMIN_EMAIL env var is missing", () => {
    delete process.env.ADMIN_EMAIL;
    const session = makeSession("admin@example.com");
    assert.equal(isAdminSession(session), false);
  });

  it("returns false when ADMIN_EMAIL env var is an empty string", () => {
    process.env.ADMIN_EMAIL = "";
    const session = makeSession("admin@example.com");
    assert.equal(isAdminSession(session), false);
  });

  it("returns false when session user email does not match ADMIN_EMAIL", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    const session = makeSession("other@example.com");
    assert.equal(isAdminSession(session), false);
  });

  it("returns true when session email matches ADMIN_EMAIL exactly", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    const session = makeSession("admin@example.com");
    assert.equal(isAdminSession(session), true);
  });

  it("returns true when comparison is case-insensitive (env uppercase, session lowercase)", () => {
    process.env.ADMIN_EMAIL = "ADMIN@EXAMPLE.COM";
    const session = makeSession("admin@example.com");
    assert.equal(isAdminSession(session), true);
  });

  it("returns true when comparison is case-insensitive (session uppercase, env lowercase)", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    const session = makeSession("ADMIN@EXAMPLE.COM");
    assert.equal(isAdminSession(session), true);
  });

  it("returns false when session user email is null", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    const session = makeSession(null);
    assert.equal(isAdminSession(session), false);
  });

  it("returns false when session user email is undefined", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    const session = makeSession(undefined);
    assert.equal(isAdminSession(session), false);
  });

  it("trims whitespace from both env and session email before comparing", () => {
    process.env.ADMIN_EMAIL = "  admin@example.com  ";
    const session = makeSession("admin@example.com");
    assert.equal(isAdminSession(session), true);
  });
});
