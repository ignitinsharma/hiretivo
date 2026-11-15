import { describe, expect, it } from "vitest";
import { signupSchema, resetSchema } from "./validation";

describe("hosted signup", () => {
  it("normalizes the account email and rejects mismatched confirmations", () => {
    expect(signupSchema.parse({ email: " Person@Example.com ", password: "correct horse battery", confirmPassword: "correct horse battery" }).email).toBe("person@example.com");
    expect(signupSchema.safeParse({ email: "person@example.com", password: "correct horse battery", confirmPassword: "different" }).success).toBe(false);
  });
  it("rejects invalid emails, short passwords, and passwords above the derivation bound", () => {
    for (const values of [{ email: "bad", password: "correct horse battery" }, { email: "a@b.com", password: "short" }, { email: "a@b.com", password: "x".repeat(129) }]) {
      expect(signupSchema.safeParse({ ...values, confirmPassword: values.password }).success).toBe(false);
    }
  });
  it("requires a correctly shaped reset token and matching new passwords", () => {
    expect(resetSchema.safeParse({ token: "invalid", password: "correct horse battery", confirmPassword: "correct horse battery" }).success).toBe(false);
    expect(resetSchema.safeParse({ token: "a".repeat(43), password: "correct horse battery", confirmPassword: "other password here" }).success).toBe(false);
  });
});
