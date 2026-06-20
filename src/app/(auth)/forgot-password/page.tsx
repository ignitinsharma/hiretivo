"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RequestResetSchema,
  type RequestResetInput,
} from "@/lib/validations/password-reset.schema";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<RequestResetInput>({
    resolver: zodResolver(RequestResetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: RequestResetInput) => {
    try {
      await authService.requestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send reset link.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-12 ">
      <section className="mx-auto w-full max-w-md rounded-xl border border-brand-border bg-white p-8">
        <div className="mb-8 space-y-3">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground ">
            Forgot your password?
          </h1>
          <p className="text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] ">
            Enter your email and we will send a reset link if the account
            exists.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-semibold leading-6 text-foreground">
              If an account exists for that email, a reset link is on the way.
              Check your inbox.
            </p>
            <Button asChild variant="secondary">
              <Link href="/seeker/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="rounded-lg"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm font-semibold text-[#d03238]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
