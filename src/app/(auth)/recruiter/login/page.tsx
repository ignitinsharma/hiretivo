"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UserRole } from "@/constants/enums";
import {
  recruiterLoginSchema,
  type RecruiterLoginInput,
} from "@/lib/validations/auth";
import { authService } from "@/services/auth.service";

const RecruiterLoginLeft = (
  <>
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-brand-primary opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-xl w-full">
      <div className="mb-12">
        <span className="text-brand-primary font-bold text-2xl tracking-tighter">Digital Architect</span>
      </div>
      <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
        Your dream remote job is just a click away.
      </h1>
      <div className="mt-12 space-y-6">
        <p className="text-slate-500 font-medium text-xs tracking-widest uppercase">Trusted by the world&apos;s best teams</p>
        <div className="flex flex-wrap gap-10 items-center">
          <div className="flex items-center gap-2 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.33-.89-2.46-1.92H7.73c.11 1.65 1.42 2.86 3.17 3.28V19h2.32v-1.63c1.66-.35 2.88-1.5 2.88-3.03 0-2.43-2.16-2.98-3.79-3.48z"/></svg>
            </div>
            <span className="font-bold text-lg text-slate-800">Stripe</span>
          </div>
          <div className="flex items-center gap-2 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
            </div>
            <span className="font-bold text-lg text-slate-800">Vercel</span>
          </div>
        </div>
      </div>
      <div className="mt-20 p-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 max-w-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-slate-200"></div>
          </div>
          <div>
            <div className="h-3 w-24 bg-slate-100 rounded-full mb-2"></div>
            <div className="h-2 w-16 bg-slate-50 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-full bg-slate-50 rounded-full"></div>
          <div className="h-2 w-4/5 bg-slate-50 rounded-full"></div>
        </div>
      </div>
    </div>
  </>
);

export default function RecruiterLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [roleMismatch, setRoleMismatch] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dest = session.user.role === UserRole.RECRUITER ? "/recruiter/dashboard" : "/seeker/dashboard";
      router.replace(dest);
    }
  }, [status, session, router]);

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
      const session = await authService.getSession();

      if (session?.user?.role !== UserRole.RECRUITER) {
        await signOut({ redirect: false });
        setRoleMismatch(true);
        return;
      }

      toast.success("Welcome back!");
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
    await signIn("google", { callbackUrl: "/recruiter/dashboard" });
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your hiring process."
      leftContent={RecruiterLoginLeft}
    >
      <div className="space-y-8">
        {roleMismatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              This account is registered as a Job Seeker.{" "}
              <Link href="/seeker/login" className="font-bold text-brand-primary underline underline-offset-4">
                Please use the Seeker login
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
          <span className="shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">OR EMAIL</span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-900 block">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-slate-400 text-slate-900"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-bold text-slate-900">Password</Label>
              <Link href="/forgot-password" className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full h-14 px-5 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-slate-400 text-slate-900"
              error={!!form.formState.errors.password}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl bg-linear-to-br from-[#5952e5] to-[#4034cc] text-white font-bold text-lg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-200 transform active:scale-[0.99] mt-2" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-slate-600 font-medium">
            New to Hiretivo?
            <Link href="/recruiter/register" className="text-brand-primary font-bold hover:underline underline-offset-4 ml-1">
              Sign up
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
}
