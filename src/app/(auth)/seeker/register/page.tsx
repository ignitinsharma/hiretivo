"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UserRole } from "@/constants/enums";
import { trackEvent } from "@/lib/analytics";
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
import { Info } from "lucide-react";

const SeekerSignupLeft = (
  <>
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-black opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-lg w-full">
      <svg
        className="w-12 h-12 text-primary mb-8"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-12">
        Work should fit your life, not the other way around.
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 max-w-md transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Daily Match
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Just for you
              </p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-400">2m ago</span>
        </div>
        <div className="bg-muted p-4 rounded-xl flex items-center gap-4 border border-slate-100">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600">
            S
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              Senior Product Architect
            </h4>
            <p className="text-xs text-slate-500">Remote • $140k - $180k</p>
          </div>
          <div className="ml-auto">
            <Button variant="primary" size="sm" className="rounded-full">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  </>
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
  const hasOAuthRoleMismatch =
    authError === "wrong_role_oauth" && accountRole === UserRole.RECRUITER;

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
      const dest =
        session.user.role === UserRole.RECRUITER
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
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
    await signIn("google", {
      callbackUrl: `/auth/oauth/resolve?entryRole=${UserRole.SEEKER}&source=seeker-register`,
    });
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start your journey to a better remote career today."
      leftContent={SeekerSignupLeft}
      role="seeker"
      backHref="/"
    >
      <div className="space-y-8">
        {roleMismatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              This account is registered as a Recruiter.{" "}
              <Link
                href="/recruiter/login"
                className="font-bold text-black underline underline-offset-4"
              >
                Please use the Recruiter login
              </Link>
            </p>
          </div>
        )}

        <OAuthButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
        />

        <div className="relative flex items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
            OR CONTINUE WITH EMAIL
          </span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-bold text-slate-900 block"
            >
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
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
                className="text-sm font-bold text-slate-900 block"
              >
                Email
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
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
            <Label
              htmlFor="password"
              className="text-sm font-bold text-slate-900 block"
            >
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="acceptTerms"
              className="mt-0.5 rounded border-slate-300 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
              checked={form.watch("acceptTerms")}
              onCheckedChange={(checked) =>
                form.setValue("acceptTerms", checked === true)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium leading-relaxed text-slate-600 cursor-pointer"
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

        <footer className=" text-center">
          <p className="text-slate-600 font-medium">
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
