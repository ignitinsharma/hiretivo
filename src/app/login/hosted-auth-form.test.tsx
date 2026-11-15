import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/hosted/actions", () => ({
  hostedSignIn: vi.fn(), requestPasswordReset: vi.fn(), resendVerification: vi.fn(),
  resetPassword: vi.fn(), verifyEmail: vi.fn(),
  signup: vi.fn(async () => ({ error: "The passwords do not match." })),
}));

import { HostedAuthForm } from "./hosted-auth-form";

describe("hosted signup corrections", () => {
  it("keeps the entered email and passwords after a validation error", async () => {
    const user = userEvent.setup();
    render(<HostedAuthForm mode="signup" />);
    await user.type(screen.getByLabelText("Email", { exact: true }), "applicant@example.test");
    await user.type(screen.getByLabelText("Password", { exact: true }), "A-password-long-enough");
    await user.type(screen.getByLabelText("Confirm password", { exact: true }), "A-different-password");
    await user.click(screen.getByRole("button", { name: "Create free account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The passwords do not match.");
    expect(screen.getByLabelText("Email", { exact: true })).toHaveValue("applicant@example.test");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("A-password-long-enough");
    expect(screen.getByLabelText("Confirm password", { exact: true })).toHaveValue("A-different-password");
  });
});
