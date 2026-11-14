"use server";

import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { deploymentMode } from "@/lib/deployment-mode";
import { logServerError } from "@/lib/log";
import { provisionTenant } from "@/lib/tenancy/provision";
import { clientIp } from "../client-ip";
import { hashPassword, verifyPassword } from "../password-hash";
import { startHostedSession } from "../session";
import { safeNextPath } from "../next-path";
import { sendAccountEmail } from "./mail";
import { consumeEmailToken, createUser, normalizeEmail, takeAuthAttempt, userByEmail } from "./store";
import { hostedEmail, resetSchema, signupSchema } from "./validation";

export type HostedFormState = { error?: string; message?: string; verificationRequired?: boolean } | null;
const text = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)) : "";
async function limited(action: string, email = "", limit = 8): Promise<boolean> {
  if (deploymentMode() !== "hosted") return true;
  const ip = clientIp(await headers());
  const checks = await Promise.all([
    takeAuthAttempt(`${action}:ip`, ip, limit, 15 * 60_000),
    takeAuthAttempt(`${action}:global`, "all", 5000, 60 * 60_000),
    ...(email ? [takeAuthAttempt(`${action}:email`, normalizeEmail(email), limit, 15 * 60_000)] : []),
  ]);
  return checks.some((allowed) => !allowed);
}
const throttleError = { error: "Too many attempts. Wait 15 minutes and try again." };
function unexpected(error: unknown): HostedFormState {
  unstable_rethrow(error);
  logServerError("hosted authentication", error);
  return { error: "We could not complete that request. Please try again." };
}
export async function signup(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    if (await limited("signup", text(form, "email"), 5)) return throttleError;
    const parsed = signupSchema.safeParse({ email: text(form, "email"), password: text(form, "password"), confirmPassword: text(form, "confirmPassword") });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { email, password } = parsed.data;
    const user = await createUser(email, await hashPassword(password));
    if (user) {
      try { await sendAccountEmail(user.id, user.email, "verify"); }
      catch (error) {
        logServerError("signup email delivery", error);
        return { error: "Your account was created, but the verification email could not be sent. Use Resend verification email below to try again." };
      }
    }
    redirect(`/verify-email-pending?email=${encodeURIComponent(email)}`);
  } catch (error) { return unexpected(error); }
}
export async function hostedSignIn(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    const email = normalizeEmail(text(form, "email"));
    if (await limited("login", email, 10)) return throttleError;
    const password = text(form, "password");
    if (!hostedEmail.safeParse(email).success || !password || password.length > 128) return { error: "The email or password is incorrect." };
    const user = await userByEmail(email);
    // Missing users still perform a password derivation, reducing email enumeration by timing.
    const valid = user && await verifyPassword(password, user.passwordHash);
    if (!user) await hashPassword(password);
    if (!valid || !user) return { error: "The email or password is incorrect." };
    if (!user.verifiedAt) return { error: "Finish verifying your email from signup before signing in.", verificationRequired: true };
    await startHostedSession(user.id, form.get("remember") === "on", user.passwordHash);
    const next = safeNextPath(text(form, "next"));
    redirect(next === "/" ? "/dashboard" : next);
  } catch (error) { return unexpected(error); }
}
export async function resendVerification(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    const parsed = hostedEmail.safeParse(text(form, "email"));
    if (!parsed.success) return { error: "Enter a valid email address." };
    if (await limited("resend-verification", parsed.data, 3)) return throttleError;
    const user = await userByEmail(parsed.data);
    if (user && !user.verifiedAt) await sendAccountEmail(user.id, user.email, "verify");
    return { message: "If that account needs verification, we have sent a new link. Check your inbox and spam folder." };
  } catch (error) { return unexpected(error); }
}
export async function verifyEmail(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    if (await limited("verify", "", 20)) return throttleError;
    const result = await consumeEmailToken(text(form, "token"), "verify", async (db, userId) => {
      try { await provisionTenant(userId); }
      catch (error) {
        logServerError("signup workspace preparation", error);
        throw new Error("SIGNUP_SETUP_FAILED");
      }
      await db.query('UPDATE public."HostedUser" SET "verifiedAt"=COALESCE("verifiedAt",now()) WHERE id=$1', [userId]);
      return true;
    });
    if (!result) return { error: "This verification link has expired or was already used. Request a new email." };
    return { message: "Your email is verified. Sign in to set up your profile and API keys." };
  } catch (error) {
    if (error instanceof Error && error.message === "SIGNUP_SETUP_FAILED") return { error: "We could not finish preparing your account. Try this verification link again, or request a new email. Your account has not been verified yet." };
    return unexpected(error);
  }
}
export async function requestPasswordReset(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    const parsed = hostedEmail.safeParse(text(form, "email"));
    if (!parsed.success) return { error: "Enter a valid email address." };
    if (await limited("request-reset", parsed.data, 3)) return throttleError;
    const user = await userByEmail(parsed.data);
    if (user?.verifiedAt) await sendAccountEmail(user.id, user.email, "reset");
    return { message: "If a verified account uses that email, we have sent a password reset link. It expires in 30 minutes." };
  } catch (error) { return unexpected(error); }
}
export async function resetPassword(_previous: HostedFormState, form: FormData): Promise<HostedFormState> {
  try {
    if (await limited("reset", "", 10)) return throttleError;
    const parsed = resetSchema.safeParse({ password: text(form, "password"), confirmPassword: text(form, "confirmPassword"), token: text(form, "token") });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const hash = await hashPassword(parsed.data.password);
    const result = await consumeEmailToken(parsed.data.token, "reset", async (db, userId) => {
      await db.query('UPDATE public."HostedUser" SET "passwordHash"=$1 WHERE id=$2', [hash, userId]);
      await db.query('DELETE FROM public."HostedSession" WHERE "userId"=$1', [userId]);
      return true;
    });
    if (!result) return { error: "This reset link has expired or was already used. Request a new link." };
    return { message: "Your password has been changed and existing sessions signed out. You can now sign in." };
  } catch (error) { return unexpected(error); }
}
