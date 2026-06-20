"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangePasswordSchema } from "@/lib/validations/interview.schema";
import { authService } from "@/services/auth.service";
import type { ChangePasswordInput } from "@/lib/validations/interview.schema";

/*
 * PasswordField
 * Controlled password input with show/hide toggle.
 */
interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  registration: ReturnType<
    ReturnType<typeof useForm<ChangePasswordInput>>["register"]
  >;
  error?: string;
  ariaInvalid?: boolean;
}

function PasswordField({
  id,
  label,
  placeholder = "••••••••",
  registration,
  error,
  ariaInvalid,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          {...registration}
          aria-invalid={ariaInvalid}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/*
 * PasswordSecuritySection
 * Lets seekers update their account password.
 * Edit-mode gated — fields hidden until Edit clicked.
 * Shows inline error on incorrect current password.
 */
export function PasswordSecuritySection() {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully.");
      form.reset();
      setIsEditing(false);
    },
    onError: (error: Error) => {
      if (error.message === "Current password is incorrect.") {
        form.setError("currentPassword", {
          message: "Current password is incorrect.",
        });
      } else {
        toast.error("Failed to update password. Try again.");
      }
    },
  });

  const handleCancel = (): void => {
    form.reset();
    setIsEditing(false);
  };

  return (
    <section
      id="security"
      className="rounded-xl border border-brand-border bg-white"
    >
      <div className="flex items-start justify-between gap-4 border-b border-brand-border-light p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Password & Security
          </h3>
          <p className="text-sm text-slate-500">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="password-security-form"
              variant="primary"
              size="sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
      {isEditing && (
        <form
          id="password-security-form"
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <PasswordField
                  id="currentPassword"
                  label="Current Password"
                  registration={form.register("currentPassword")}
                  error={form.formState.errors.currentPassword?.message}
                  ariaInvalid={!!form.formState.errors.currentPassword}
                />
              </div>
              <PasswordField
                id="newPassword"
                label="New Password"
                registration={form.register("newPassword")}
                error={form.formState.errors.newPassword?.message}
                ariaInvalid={!!form.formState.errors.newPassword}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                registration={form.register("confirmPassword")}
                error={form.formState.errors.confirmPassword?.message}
                ariaInvalid={!!form.formState.errors.confirmPassword}
              />
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
