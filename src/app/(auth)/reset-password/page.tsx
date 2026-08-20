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
  // Cosmetic only — the server never trusts this param.
  const isSet = searchParams.get("mode") === "set";

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
      toast.success(isSet ? "Password created" : "Password updated");
      router.push("/seeker/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reset password.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-surface px-4 py-12">
      <section className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="font-bold text-3xl md:text-4xl leading-tight tracking-tight text-brand-foreground">
            {isSet ? "Set your password" : "Reset password"}
          </h1>
          <p className="text-lg font-medium leading-relaxed text-brand-foreground-muted">
            {isSet
              ? "Create a password for your Hiretivo account."
              : "Choose a new password for your Hiretivo account."}
          </p>
        </div>

        {!token || !email ? (
          <div className="space-y-6 rounded-xl border border-brand-border bg-white p-8">
            <p className="rounded-xl bg-brand-surface p-4 text-sm font-semibold leading-6 text-brand-foreground">
              This reset link is invalid or has expired. Please request a new
              one.
            </p>
            <Button
              asChild
              variant="primary"
              className="w-full"
            >
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-brand-border bg-white p-8">
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-sm font-bold text-brand-foreground"
              >
                {isSet ? "Password" : "New password"}
              </Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="Enter your new password"
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
                className="text-sm font-bold text-brand-foreground"
              >
                Confirm password
              </Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your new password"
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
              variant="primary"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="w-full"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isSet ? "Setting..." : "Updating..."}
                </>
              ) : (
                isSet ? "Set password" : "Update password"
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
