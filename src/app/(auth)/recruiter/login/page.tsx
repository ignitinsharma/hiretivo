"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthLastUsedBadge, OAuthButton } from "@/components/auth/OAuthButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UserRole } from "@/constants/enums";
import { trackEvent } from "@/lib/analytics";
import {
  getLastUsedAuthMethodFromDocument,
  setBrowserLastUsedAuthMethodCookie,
  type AuthMethod,
} from "@/lib/auth/last-used-method";
import {
  recruiterLoginSchema,
  type RecruiterLoginInput,
} from "@/lib/validations/auth";

const RecruiterLoginLeft = (
  <>
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-black opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-xl w-full">
      <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
        Your dream team
        <p className="text-primary">just a click away. </p>
      </h1>
      <div className="mt-12 space-y-6">
        <p className="text-slate-500 font-medium text-xs tracking-widest uppercase">
          Trusted by the world&apos;s best teams
        </p>
        <div className="flex flex-wrap gap-10 items-center">
          <div className="flex items-center gap-2 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.33-.89-2.46-1.92H7.73c.11 1.65 1.42 2.86 3.17 3.28V19h2.32v-1.63c1.66-.35 2.88-1.5 2.88-3.03 0-2.43-2.16-2.98-3.79-3.48z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-800">Stripe</span>
          </div>
          <div className="flex items-center gap-2 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-800">Vercel</span>
          </div>
        </div>
      </div>
      <div className="mt-20 space-y-4">
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 p-6 max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Applicants</p>
                <p className="text-sm font-semibold text-slate-900">Senior React Developer</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-full">12</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold">JD</div>
              <div className="flex-1">
                <div className="h-2.5 w-20 bg-slate-200 rounded-full mb-1.5"></div>
                <div className="h-2 w-14 bg-slate-100 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-brand-primary">98%</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-bold">SK</div>
              <div className="flex-1">
                <div className="h-2.5 w-24 bg-slate-200 rounded-full mb-1.5"></div>
                <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-brand-primary">94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

function RecruiterLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [roleMismatch, setRoleMismatch] = React.useState(false);
  const [isHandlingOAuthMismatch, setIsHandlingOAuthMismatch] = React.useState(false);
  const [lastUsedAuthMethod, setLastUsedAuthMethod] =
    React.useState<AuthMethod | null>(null);
  const authError = searchParams.get("authError");
  const accountRole = searchParams.get("accountRole");
  const hasOAuthRoleMismatch =
    authError === "wrong_role_oauth" && accountRole === UserRole.SEEKER;

  React.useEffect(() => {
    setLastUsedAuthMethod(getLastUsedAuthMethodFromDocument("recruiter"));
  }, []);

  React.useEffect(() => {
    if (!hasOAuthRoleMismatch) return;

    setRoleMismatch(true);
    let isMounted = true;

    const cleanParams = () => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("authError");
      next.delete("accountRole");
      const query = next.toString();
      router.replace(query ? `/recruiter/login?${query}` : "/recruiter/login", {
        scroll: false,
      });
    };

    const handleMismatch = async () => {
      if (status === "authenticated") {
        if (isMounted) setIsHandlingOAuthMismatch(true);
        await signOut({ redirect: false });
      }
      cleanParams();
      if (isMounted) setIsHandlingOAuthMismatch(false);
    };

    void handleMismatch();
    return () => {
      isMounted = false;
    };
  }, [hasOAuthRoleMismatch, status, searchParams, router]);

  React.useEffect(() => {
    if (status === "authenticated" && session?.user && !hasOAuthRoleMismatch && !isHandlingOAuthMismatch) {
      const dest =
        session.user.role === UserRole.RECRUITER
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
      router.replace(dest);
    }
  }, [status, session, router, hasOAuthRoleMismatch, isHandlingOAuthMismatch]);

  const form = useForm<RecruiterLoginInput>({
    resolver: zodResolver(recruiterLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (status === "loading" || status === "authenticated") return null;

  const onSubmit = async (data: RecruiterLoginInput) => {
    setIsSubmitting(true);
    setRoleMismatch(false);
    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      // Verify the authenticated user has the RECRUITER role
      const session = await getSession();

      if (session?.user?.role !== UserRole.RECRUITER) {
        await signOut({ redirect: false });
        setRoleMismatch(true);
        return;
      }

      toast.success("Welcome back!");
      setBrowserLastUsedAuthMethodCookie("recruiter", "email");
      setLastUsedAuthMethod("email");
      trackEvent("login", {
        role: UserRole.RECRUITER,
        auth_method: "credentials",
        stage: "success",
      });
      router.push("/recruiter/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    trackEvent("login", {
      role: UserRole.RECRUITER,
      auth_method: "google",
      stage: "attempt",
    });
    await signIn("google", {
      callbackUrl: `/auth/oauth/resolve?entryRole=${UserRole.RECRUITER}&source=recruiter-login`,
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your hiring process."
      leftContent={RecruiterLoginLeft}
      role="recruiter"
      backHref="/"
    >
      <div className="space-y-8">
        {roleMismatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              This account is registered as a Job Seeker.{" "}
              <Link
                href="/seeker/login"
                className="font-bold text-black underline underline-offset-4"
              >
                Please use the Seeker login
              </Link>
            </p>
          </div>
        )}

        <OAuthButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          showLastUsed={lastUsedAuthMethod === "google"}
        />

        <div className="relative flex items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            OR EMAIL
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-slate-900 block"
              >
                Email
              </Label>
              {lastUsedAuthMethod === "email" && <AuthLastUsedBadge />}
            </div>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-bold text-slate-900"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-black hover:text-black/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full h-14 px-5 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              error={!!form.formState.errors.password}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary-dark transition-all duration-200 transform active:scale-[0.99] mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-slate-600 font-medium">
            New to Hiretivo?
            <Link
              href="/recruiter/register"
              className="text-black font-bold hover:underline underline-offset-4 ml-1"
            >
              Sign up
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
}

export default function RecruiterLoginPage() {
  return (
    <React.Suspense fallback={null}>
      <RecruiterLoginContent />
    </React.Suspense>
  );
}
