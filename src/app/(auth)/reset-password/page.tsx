"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ConfirmResetSchema } from "@/lib/validations/password-reset.schema";
import { authService } from "@/services/auth.service";

const ResetPasswordFormSchema = ConfirmResetSchema.pick({
  newPassword: true,
})
  .extend({
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormInput) => {
    if (!token || !email) return;

    try {
      await authService.confirmPasswordReset({
        email,
        token,
        newPassword: values.newPassword,
      });
      toast.success("Password updated");
      router.push("/seeker/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reset password.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-12">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            Reset password
          </h1>
          <p className="text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745]">
            Choose a new password for your Hiretivo account.
          </p>
        </div>

        {!token || !email ? (
          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-8">
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-semibold leading-6 text-foreground">
              This reset link is invalid or has expired. Please request a new
              one.
            </p>
            <Button
              asChild
              className="w-full rounded-full bg-brand-primary font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-gray-200 bg-white p-8">
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm font-bold text-slate-900"
              >
                New password
              </Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="Enter your new password"
                className="w-full h-14 px-5 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
                error={!!form.formState.errors.newPassword}
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-bold text-slate-900"
              >
                Confirm password
              </Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                className="w-full h-14 px-5 bg-white border border-slate-200 rounded-lg focus:ring-0 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
                error={!!form.formState.errors.confirmPassword}
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant={"primary"}
              disabled={form.formState.isSubmitting}
              className="w-full h-14 rounded-xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary-dark transition-all duration-200 transform active:scale-[0.99]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
