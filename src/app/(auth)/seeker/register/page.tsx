"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreditCard, FileText, Info, LayoutDashboard, Search, Zap } from "lucide-react";

import { AuthValuePanel, type AuthValueBlurb } from "@/components/auth/AuthValuePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthErrorCode, OAuthIntentSource, UserRole } from "@/constants/enums";
import { trackEvent } from "@/lib/analytics";
import { setBrowserOAuthIntentCookie } from "@/lib/auth/oauth-intent";
import {
  seekerRegisterSchema,
  type SeekerRegisterInput,
} from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SEEKER_SIGNUP_BLURBS: AuthValueBlurb[] = [
  {
    icon: FileText,
    title: "AI Resume Engine",
    description: "Paste a job link. Get a tailored, ATS-ready resume in seconds.",
  },
  {
    icon: Search,
    title: "Job matching",
    description: "Browse roles matched to your skills, or add any job by URL.",
  },
  {
    icon: LayoutDashboard,
    title: "Application tracker",
    description: "Track every application from applied to offer on one kanban board.",
  },
];

const SeekerSignupLeft = (
  <AuthValuePanel
    headline={
      <>
        Land your next remote role —{" "}
        <span className="text-brand-primary">faster.</span>
      </>
    }
    subtitle="Paste any job link. Get a tailored, ATS-ready resume in seconds. Browse, apply, and track it all in one place."
    blurbs={SEEKER_SIGNUP_BLURBS}
    footer={
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-foreground-muted">
          <CreditCard className="h-3.5 w-3.5 text-brand-primary" />
          No Credit Card
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-foreground-muted">
          <Zap className="h-3.5 w-3.5 text-brand-primary" />
          5-min Setup
        </span>
      </div>
    }
  />
);

function SeekerRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [roleMismatch, setRoleMismatch] = React.useState(false);
  const [isHandlingOAuthMismatch, setIsHandlingOAuthMismatch] =
    React.useState(false);
  const authError = searchParams.get("authError");
  const accountRole = searchParams.get("accountRole");
  const hasOAuthRoleMismatch = false;
  const hasOAuthAccountNotLinked =
    authError === AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED;

  React.useEffect(() => {
    if (!hasOAuthRoleMismatch) return;

    setRoleMismatch(true);
    let isMounted = true;

    const cleanParams = () => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("authError");
      next.delete("accountRole");
      const query = next.toString();
      router.replace(query ? `/seeker/register?${query}` : "/seeker/register", {
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
    if (
      status === "authenticated" &&
      session?.user &&
      !hasOAuthRoleMismatch &&
      !isHandlingOAuthMismatch
    ) {
      const dest = "/dashboard";
      router.replace(dest);
    }
  }, [status, session, router, hasOAuthRoleMismatch, isHandlingOAuthMismatch]);

  const form = useForm<SeekerRegisterInput>({
    resolver: zodResolver(seekerRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  if (status === "loading" || status === "authenticated") return null;

  const onSubmit = async (data: SeekerRegisterInput) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create user account (per D-01)
      await authService.register({
        email: data.email.toLowerCase(),
        password: data.password,
        name: data.name,
        role: UserRole.SEEKER,
      });

      // Step 2: Sign in immediately after creation (per D-01)
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          "Account created but sign-in failed. Please try logging in.",
        );
        return;
      }

      toast.success("Account created successfully!");
      trackEvent("sign_up", {
        role: UserRole.SEEKER,
        auth_method: "credentials",
        stage: "success",
      });
      router.push("/seeker/onboarding");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    trackEvent("sign_up", {
      role: UserRole.SEEKER,
      auth_method: "google",
      stage: "attempt",
    });
    setBrowserOAuthIntentCookie(OAuthIntentSource.SEEKER_REGISTER);
    await signIn("google", {
      callbackUrl: `/auth/oauth/resolve?entryRole=${UserRole.SEEKER}&source=seeker-register`,
    });
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start your journey to a better remote career today."
      leftContent={SeekerSignupLeft}
      backHref="/"
    >
      <div className="space-y-6">
        {hasOAuthAccountNotLinked && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              This email already has an account.{" "}
              <Link
                href="/seeker/login"
                className="font-bold text-black underline underline-offset-4"
              >
                Sign in with email and password instead
              </Link>
              , or{" "}
              <Link
                href="/forgot-password"
                className="font-bold text-black underline underline-offset-4"
              >
                reset your password
              </Link>{" "}
              if needed.
            </p>
          </div>
        )}

        <OAuthButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
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
            <Label
              htmlFor="name"
              className="text-sm font-bold text-brand-foreground block"
            >
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              className="w-full bg-white border border-brand-border rounded-lg focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary placeholder:text-brand-foreground-secondary text-brand-foreground"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="email"
                className="text-sm font-bold text-brand-foreground block"
              >
                Email
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-brand-foreground-secondary hover:text-brand-foreground-muted cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm leading-relaxed">
                    <p>
                      Use the email where you&apos;ll receive interview
                      shortlists, application updates, and messages from HR.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            <Label
              htmlFor="password"
              className="text-sm font-bold text-brand-foreground block"
            >
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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

          <div className="flex items-center space-x-3 ">
            <Checkbox
              id="acceptTerms"
              className="mt-0.5 rounded border-brand-border data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
              checked={form.watch("acceptTerms")}
              onCheckedChange={(checked) =>
                form.setValue("acceptTerms", checked === true)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium leading-relaxed text-brand-foreground-muted cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-black hover:underline font-bold"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-black hover:underline font-bold"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          </div>
          {form.formState.errors.acceptTerms && (
            <p className="text-sm text-destructive">
              {form.formState.errors.acceptTerms.message}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            loadingText="Creating account..."
          >
            Create Account
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-brand-foreground-muted font-medium">
            Already have an account?
            <Link
              href="/seeker/login"
              className="text-black font-bold hover:underline underline-offset-4 ml-1"
            >
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
}

export default function SeekerRegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <SeekerRegisterContent />
    </React.Suspense>
  );
}
