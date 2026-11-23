import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";

import { deploymentMode } from "@/lib/deployment-mode";
import { AuthFrame } from "./auth-frame";
import { HostedAuthForm } from "./hosted-auth-form";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Password-only sign-in, outside the app shell (PRD AUTH-1, AUTH-8). */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;
  if (deploymentMode() === "hosted") return <AuthFrame title="Welcome back" description="Sign in with your email and password to continue your job search."><HostedAuthForm mode="login" next={typeof next === "string" ? next : ""} /></AuthFrame>;

  return (
    // The form on the panel's colour, a warm wash on the right.
    <main data-hiretivo-onboarding className="grid min-h-screen bg-surface min-[960px]:grid-cols-2">
      <div className="flex items-center justify-center px-8 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-8">
        <div className="flex flex-col items-start gap-2">
          <BrandMark className="size-10" />
          <div className="flex flex-col">
            <div className="text-title text-primary-text">Hiretivo</div>
            <div className="text-sm text-muted">Your job search, on your server</div>
          </div>
        </div>
        <LoginForm next={typeof next === "string" ? next : undefined} />
        <p className="text-meta leading-[1.6] text-pretty text-muted">
          Enter the password set as{" "}
          <code className="font-mono text-label">HIRETIVO_PASSWORD</code> in the server&apos;s .env file.
          To change it, edit that value and restart the server.
        </p>
      </div>
      </div>
      <div
        aria-hidden="true"
        className="hidden bg-[linear-gradient(to_left,color-mix(in_srgb,var(--color-ink)_9%,transparent)_0%,transparent_65%)] min-[960px]:grid min-[960px]:place-items-center"
      >
        <BrandMark className="size-40 opacity-90 shadow-dialog rounded-[36px]" />
      </div>
    </main>
  );
}
