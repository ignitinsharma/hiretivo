'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <button
      type="button"
      className="text-red-600 flex items-center gap-2 cursor-pointer w-full text-sm"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
