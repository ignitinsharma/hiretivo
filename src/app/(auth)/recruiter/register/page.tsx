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
  recruiterRegisterSchema,
  type RecruiterRegisterInput,
} from "@/lib/validations/auth";

const RecruiterSignupLeft = (
  <>
    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-brand-primary opacity-5 blur-3xl"></div>
    <div className="relative z-10 max-w-xl w-full">
      <div className="mb-12">
        <span className="text-brand-primary font-bold text-2xl tracking-tighter">Digital Architect</span>
      </div>
      <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
        Build your dream team.
      </h1>
      <p className="text-slate-600 text-lg lg:text-xl font-medium mb-12 max-w-md leading-relaxed">
        Join leading architectural firms hiring top remote talent across the globe.
      </p>
      
      <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 max-w-sm mb-12 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-primary-light rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Top 1% Talent</h4>
            <p className="text-xs text-slate-500">Pre-vetted professionals</p>
          </div>
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

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

  const onSubmit = async (data: RecruiterRegisterInput) => {
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
          role: "RECRUITER",
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
      router.push("/recruiter/onboarding");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", {
      role: "RECRUITER",
      callbackUrl: "/recruiter/onboarding",
    });
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start hiring the best remote talent today."
      leftContent={RecruiterSignupLeft}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-slate-900 block">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-slate-400 text-slate-900"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-bold text-slate-900 block">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc"
                autoComplete="organization"
                className="w-full px-5 h-14 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-slate-400 text-slate-900"
                {...form.register("companyName")}
              />
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-900 block">Work Email</Label>
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
            <Label htmlFor="password" className="text-sm font-bold text-slate-900 block">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full h-14 px-5 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-black outline-none transition-all placeholder:text-slate-400 text-slate-900"
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
            className="w-full h-14 rounded-xl bg-linear-to-br from-[#5952e5] to-[#4034cc] text-white font-bold text-lg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all duration-200 transform active:scale-[0.99]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : "Create Hiring Account"}
          </Button>
        </form>

        <footer className="pt-4 text-center">
          <p className="text-slate-600 font-medium">
            Already have an account?
            <Link href="/recruiter/login" className="text-brand-primary font-bold hover:underline underline-offset-4 ml-1">
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
}
