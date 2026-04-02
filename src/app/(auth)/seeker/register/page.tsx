"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
import {
  seekerRegisterSchema,
  type SeekerRegisterInput,
} from "@/lib/validations/auth";

const SeekerSignupLeft = (
  <>
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-brand-primary opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-lg w-full">
      <header className="absolute -top-32 left-0 w-full pointer-events-none text-left">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 bg-linear-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-bold text-2xl tracking-tighter text-brand-primary">Digital Architect</span>
        </div>
      </header>
      
      <svg className="w-12 h-12 text-brand-primary mb-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
      </svg>
      <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 mb-12">
        Work should fit your life, not the other way around.
      </h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 max-w-md transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Match</p>
              <p className="text-sm font-semibold text-slate-900">Just for you</p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-400">2m ago</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 border border-slate-100">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">S</div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Senior Product Architect</h4>
            <p className="text-xs text-slate-500">Remote • $140k - $180k</p>
          </div>
          <div className="ml-auto">
            <button className="bg-brand-primary text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Apply</button>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default function SeekerRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const form = useForm<SeekerRegisterInput>({
    resolver: zodResolver(seekerRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SeekerRegisterInput) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create user account (per D-01)
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.toLowerCase(),
          password: data.password,
          name: data.name,
          role: "SEEKER",
        }),
      });

      if (!registerRes.ok) {
        const err = await registerRes.json();
        if (registerRes.status === 409) {
          toast.error("An account with this email already exists.");
        } else {
          toast.error(err.error ?? "Failed to create account. Please try again.");
        }
        return;
      }

      // Step 2: Sign in immediately after creation (per D-01)
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Account created but sign-in failed. Please try logging in.");
        return;
      }

      toast.success("Account created successfully!");
      router.push("/seeker/onboarding");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { role: "SEEKER", callbackUrl: "/seeker/onboarding" });
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start your journey to a better remote career today."
      leftContent={SeekerSignupLeft}
    >
      <div className="space-y-8">
        <OAuthButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
        />

        <div className="relative flex items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">OR CONTINUE WITH EMAIL</span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-slate-900 block">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              className="w-full px-5 h-14 bg-white border border-slate-200 rounded-xl focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-900 block">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full px-5 h-14 bg-white border border-slate-200 rounded-xl focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-slate-900 block">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              error={!!form.formState.errors.password}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
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
                I agree to the <Link href="/terms" className="text-brand-primary hover:underline font-bold">Terms of Service</Link> and <Link href="/privacy" className="text-brand-primary hover:underline font-bold">Privacy Policy</Link>.
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
            className="w-full h-14 rounded-xl bg-linear-to-br from-[#5951E5] to-[#4034cc] text-white font-bold text-lg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-200 transform active:scale-[0.99]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : "Create Account"}
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-slate-600 font-medium">
            Already have an account?
            <Link href="/seeker/login" className="text-brand-primary font-bold hover:underline underline-offset-4 ml-1">
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
}
