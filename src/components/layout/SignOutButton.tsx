'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SignOutButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SignOutButton({ className, ...props }: SignOutButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 text-sm font-semibold text-red-600",
        className,
      )}
      onClick={() => signOut({ callbackUrl: '/' })}
      {...props}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
