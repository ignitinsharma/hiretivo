'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmResetSchema } from '@/lib/validations/password-reset.schema';
import { authService } from '@/services/auth.service';

const ResetPasswordFormSchema = ConfirmResetSchema.pick({
  newPassword: true,
}).extend({
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
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
      toast.success('Password updated');
      router.push('/seeker/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reset password.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-12 ">
      <section className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-8 space-y-3">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground ">
            Reset password
          </h1>
          <p className="text-[18px] font-semibold leading-[1.44] tracking-[-0.108px] text-[#454745] ">
            Choose a new password for your Hiretivo account.
          </p>
        </div>

        {!token || !email ? (
          <div className="space-y-6">
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-semibold leading-6 text-foreground">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              asChild
              className="w-full rounded-full bg-black font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-semibold text-foreground">
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="rounded-xl focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/30"
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm font-semibold text-[#d03238]">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-semibold text-foreground">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="rounded-xl focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/30"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm font-semibold text-[#d03238]">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full rounded-full bg-black font-semibold text-white transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-black/30"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update password'
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
