"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/field";
import { hostedSignIn, requestPasswordReset, resendVerification, resetPassword, signup, verifyEmail } from "@/lib/auth/hosted/actions";

export type AuthFormMode = "login" | "signup" | "resend" | "forgot" | "reset" | "verify";
const actions = { login: hostedSignIn, signup, resend: resendVerification, forgot: requestPasswordReset, reset: resetPassword, verify: verifyEmail };
const labels = { login: "Sign in", signup: "Create free account", resend: "Resend verification email", forgot: "Send reset link", reset: "Save new password", verify: "Verify email" };
export function HostedAuthForm({ mode, email = "", token = "", next = "" }: { mode: AuthFormMode; email?: string; token?: string; next?: string }) {
  const [state, action, pending] = useActionState(actions[mode], null);
  const [emailInput, setEmailInput] = useState(email);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const hasEmail = ["login", "signup", "resend", "forgot"].includes(mode);
  const hasPassword = ["login", "signup", "reset"].includes(mode);
  const complete = Boolean(state?.message) && ["reset", "verify"].includes(mode);
  return (
    <form action={action} className="flex flex-col gap-5">
      {token && <input type="hidden" name="token" value={token} />}
      {next && <input type="hidden" name="next" value={next} />}
      {!complete && <>
        {hasEmail && <label className="flex flex-col gap-2 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required maxLength={254} value={emailInput} onChange={(event) => setEmailInput(event.target.value)} className={`${controlClassName} h-11 px-3`} /></label>}
        {hasPassword && <div className="flex flex-col gap-2 text-sm font-medium"><label htmlFor={`${mode}-password`}>{mode === "reset" ? "New password" : "Password"}</label><input id={`${mode}-password`} name="password" type="password" value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? undefined : 12} maxLength={128} aria-describedby={mode !== "login" ? `${mode}-password-help` : undefined} className={`${controlClassName} h-11 px-3`} />{mode !== "login" && <span id={`${mode}-password-help`} className="text-meta font-normal text-muted">Use 12–128 characters.</span>}</div>}
        {["signup", "reset"].includes(mode) && <label className="flex flex-col gap-2 text-sm font-medium">Confirm password<input name="confirmPassword" type="password" value={confirmationInput} onChange={(event) => setConfirmationInput(event.target.value)} autoComplete="new-password" required maxLength={128} className={`${controlClassName} h-11 px-3`} /></label>}
        {mode === "login" && <label className="flex items-center gap-2 text-sm text-muted"><input name="remember" type="checkbox" />Keep me signed in for 30 days</label>}
        <Button type="submit" size="lg" loading={pending} disabled={pending}>{pending ? "Please wait…" : labels[mode]}</Button>
      </>}
      {state?.error && <p role="alert" className="text-sm text-error">{state.error}</p>}
      {state?.verificationRequired && <Link href={`/verify-email-pending?email=${encodeURIComponent(emailInput)}`} className="text-sm underline underline-offset-4">Finish signup verification</Link>}
      {state?.message && <p role="status" className="text-sm text-primary-text">{state.message}</p>}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        {mode === "login" ? <><Link href="/signup" className="underline underline-offset-4">Create an account</Link><Link href="/forgot-password" className="underline underline-offset-4">Forgot password?</Link></> : <Link href="/login" className="underline underline-offset-4">Sign in</Link>}
        {mode === "signup" || mode === "verify" ? <Link href="/verify-email-pending" className="underline underline-offset-4">Resend verification email</Link> : null}
        {mode === "reset" && !complete && <Link href="/forgot-password" className="underline underline-offset-4">Request a new reset link</Link>}
      </div>
    </form>
  );
}
