"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthLastUsedBadge, OAuthButton } from "@/components/auth/OAuthButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthErrorCode, OAuthIntentSource, UserRole } from "@/constants/enums";
import { trackEvent } from "@/lib/analytics";
import {
  getLastUsedAuthMethodFromDocument,
  setBrowserLastUsedAuthMethodCookie,
  type AuthMethod,
} from "@/lib/auth/last-used-method";
import { setBrowserOAuthIntentCookie } from "@/lib/auth/oauth-intent";
import {
  seekerLoginSchema,
  type SeekerLoginInput,
} from "@/lib/validations/auth";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

const SeekerLoginLeft = (
  <>
    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-black opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-lg w-full">
      <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-brand-foreground mb-6">
        Your resume. Rewritten{" "}
        <span className="text-brand-primary">by AI.</span>{" "}
        <span className="italic">For every job.</span>
      </h1>
      <p className="text-brand-foreground-muted font-medium text-base leading-relaxed mb-8 max-w-md">
        Paste any job link. Get a tailored, ATS-ready resume in seconds.
      </p>

      <div className="relative mb-3 max-w-sm">
        <span className="absolute -top-2.5 left-3 z-10 rounded-pill border border-brand-border bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-foreground-muted">
          Before
        </span>
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
          <Image
            src="/images/resume-before.png"
            alt="Generic, unoptimized resume"
            width={1103}
            height={1426}
            className="w-full h-auto opacity-60"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 my-1">
        <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden="true" />
        <span className="text-xs font-semibold text-brand-primary">AI rewrites every bullet</span>
        <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden="true" />
      </div>

      <div className="relative mt-3 max-w-sm">
        <span className="absolute -top-2.5 right-3 z-10 inline-flex items-center gap-1 rounded-pill bg-brand-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          AI Rewrote This
        </span>
        <div className="overflow-hidden rounded-xl border border-brand-primary/30 bg-white">
          <Image
            src="/images/resume-after.png"
            alt="AI-optimized resume"
            width={820}
            height={1125}
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-brand-foreground-muted">
        <span>10k+ resumes</span>
        <span className="text-brand-border">·</span>
        <span>98% ATS pass rate</span>
        <span className="text-brand-border">·</span>
        <span>30 seconds</span>
      </div>
    </div>
  </>
);

function SeekerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [roleMismatch, setRoleMismatch] = React.useState(false);
  const [isHandlingOAuthMismatch, setIsHandlingOAuthMismatch] = React.useState(false);
  const [lastUsedAuthMethod, setLastUsedAuthMethod] =
    React.useState<AuthMethod | null>(null);
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
  const authError = searchParams.get("authError");
  const accountRole = searchParams.get("accountRole");
  const hasOAuthRoleMismatch = false;
  const hasOAuthAccountNotLinked =
    authError === AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED;

  React.useEffect(() => {
    setLastUsedAuthMethod(getLastUsedAuthMethodFromDocument("seeker"));
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
      router.replace(query ? `/seeker/login?${query}` : "/seeker/login", {
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
      const dest = redirectPath;
      router.replace(dest);
    }
  }, [status, session, router, redirectPath, hasOAuthRoleMismatch, isHandlingOAuthMismatch]);

  const form = useForm<SeekerLoginInput>({
    resolver: zodResolver(seekerLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (status === "loading" || status === "authenticated") return null;

  const onSubmit = async (data: SeekerLoginInput) => {
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

      // Verify the authenticated user has the SEEKER role
      const session = await getSession();

      if (session?.user?.role !== UserRole.SEEKER) {
        await signOut({ redirect: false });
        setRoleMismatch(true);
        return;
      }

      toast.success("Welcome back!");
      setBrowserLastUsedAuthMethodCookie("seeker", "email");
      setLastUsedAuthMethod("email");
      trackEvent("login", {
        role: UserRole.SEEKER,
        auth_method: "credentials",
        stage: "success",
      });
      router.push(redirectPath);
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
      role: UserRole.SEEKER,
      auth_method: "google",
      stage: "attempt",
    });
    const next = encodeURIComponent(redirectPath);
    setBrowserOAuthIntentCookie(OAuthIntentSource.SEEKER_LOGIN, redirectPath);
    await signIn("google", {
      callbackUrl: `/auth/oauth/resolve?entryRole=${UserRole.SEEKER}&source=seeker-login&next=${next}`,
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to access your personalized job matches."
      leftContent={SeekerLoginLeft}
      backHref="/"
    >
      <div className="space-y-6">
        {hasOAuthAccountNotLinked && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              This email is already registered with email and password. Sign in
              with your password, or{" "}
              <Link
                href="/forgot-password"
                className="font-bold text-black underline underline-offset-4"
              >
                reset it
              </Link>{" "}
              if you do not remember it.
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
          <div className="grow border-t border-brand-border"></div>
          <span className="shrink mx-4 text-[10px] font-bold text-brand-foreground-secondary uppercase tracking-[0.2em] whitespace-nowrap">
            OR CONTINUE WITH EMAIL
          </span>
          <div className="grow border-t border-brand-border"></div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-brand-foreground block"
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
              className="w-full bg-white border border-brand-border rounded-lg focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary placeholder:text-brand-foreground-secondary text-brand-foreground"
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
                className="text-sm font-bold text-brand-foreground"
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
              className="w-full bg-white border border-brand-border rounded-lg focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary placeholder:text-brand-foreground-secondary text-brand-foreground"
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
            variant="primary"
            size="lg"
            className="w-full mt-2"
            loading={isSubmitting}
            loadingText="Signing in..."
          >
            Sign In
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-brand-foreground-muted font-medium">
            New to Hiretivo?
            <Link
              href="/seeker/register"
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

export default function SeekerLoginPage() {
  return (
    <React.Suspense fallback={null}>
      <SeekerLoginContent />
    </React.Suspense>
  );
}
