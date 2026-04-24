"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePasswordSchema } from "@/lib/validations/interview.schema";
import type { ChangePasswordInput } from "@/lib/validations/interview.schema";

export function PasswordSecuritySection() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: ChangePasswordInput) => {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to update password");
      }
    },
    onSuccess: () => {
      toast.success("Password updated successfully.");
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message === "Current password is incorrect.") {
        form.setError("currentPassword", { message: "Current password is incorrect." });
      } else {
        toast.error("Failed to update password. Try again.");
      }
    },
  });

  return (
    <section
      id="security"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Password & Security</h3>
        <p className="text-sm text-slate-500">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("currentPassword")}
                aria-invalid={!!form.formState.errors.currentPassword}
              />
              {form.formState.errors.currentPassword && (
                <p className="text-xs text-red-500">{form.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("newPassword")}
                aria-invalid={!!form.formState.errors.newPassword}
              />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                aria-invalid={!!form.formState.errors.confirmPassword}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" variant="default" size="sm" className="px-5" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
