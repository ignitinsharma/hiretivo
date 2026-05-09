"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  recruiterRegisterSchema,
  type RecruiterRegisterInput,
} from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";

const RecruiterSignupLeft = (
  <>
    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-black opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-xl w-full">
      <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
        Build your dream <span className="text-primary">team.</span>
      </h1>
      <p className="text-slate-600 text-lg lg:text-xl font-medium mb-12 max-w-md leading-relaxed">
        Join leading architectural firms hiring top remote talent across the
        globe.
      </p>

      <div className="bg-white p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 max-w-sm mb-12 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Top 1% Talent</h4>
            <p className="text-xs text-slate-500">Pre-vetted professionals</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-primary/20"></div>
            <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-primary/40"></div>
            <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-primary/60"></div>
          </div>
          <span className="text-xs text-slate-500">2,400+ candidates ready</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#f8f8fd] bg-slate-200"></div>
          <div className="w-8 h-8 rounded-full border-2 border-[#f8f8fd] bg-slate-300"></div>
          <div className="w-8 h-8 rounded-full border-2 border-[#f8f8fd] bg-slate-400"></div>
        </div>
        <span>10,000+ recruiters already joined</span>
      </div>
    </div>
  </>
);

export default function RecruiterRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dest =
        session.user.role === UserRole.RECRUITER
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
      router.replace(dest);
    }
  }, [status, session, router]);

  const form = useForm<RecruiterRegisterInput>({
    resolver: zodResolver(recruiterRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      password: "",
      acceptTerms: false,
    },
  });

  if (status === "loading" || status === "authenticated") return null;

  const onSubmit = async (data: RecruiterRegisterInput) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create user account (per D-01)
      await authService.register({
        email: data.email.toLowerCase(),
        password: data.password,
        name: data.name,
        role: UserRole.RECRUITER,
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
        role: UserRole.RECRUITER,
        auth_method: "credentials",
        stage: "success",
      });
      router.push("/recruiter/onboarding");
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
      role: UserRole.RECRUITER,
      auth_method: "google",
      stage: "attempt",
    });
    await signIn("google", {
      role: UserRole.RECRUITER,
      callbackUrl: "/recruiter/onboarding",
    });
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start hiring the best remote talent today."
      leftContent={RecruiterSignupLeft}
      role="recruiter"
      backHref="/"
    >
      <div className="space-y-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label
                htmlFor="companyName"
                className="text-sm font-bold text-slate-900 block"
              >
                Company Name
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc"
                autoComplete="organization"
                className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
                {...form.register("companyName")}
              />
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-bold text-slate-900 block"
            >
              Work Email
            </Label>
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
            className="w-full h-14 rounded-xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary-dark transition-all duration-200 transform active:scale-[0.99]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Hiring Account"
            )}
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-slate-600 font-medium">
            Already have an account?
            <Link
              href="/recruiter/login"
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
