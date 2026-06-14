'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AccountMenuProps {
  settingsHref: string;
  fallbackName: string;
  fallbackEmail: string;
  ariaLabel: string;
  className?: string;
  fallbackSeed?: string;
  verified?: boolean;
}

/*
 * AccountMenu
 * Shared profile dropdown for app headers with avatar, account details, settings, and sign out.
 */
export function AccountMenu({
  settingsHref,
  fallbackName,
  fallbackEmail,
  ariaLabel,
  className,
  fallbackSeed,
  verified = false,
}: AccountMenuProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? fallbackName;
  const userEmail = session?.user?.email ?? fallbackEmail;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white transition-colors hover:bg-brand-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20',
            className,
          )}
          aria-label={ariaLabel}
        >
          <InitialsAvatar
            name={userName}
            email={session?.user?.email}
            userId={session?.user?.id}
            image={session?.user?.image}
            fallbackSeed={fallbackSeed}
            size="md"
            verified={verified}
            className="bg-brand-surface"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border-brand-border bg-white p-1 shadow-none"
      >
        <DropdownMenuLabel className="px-3 py-3">
          <span className="block truncate text-sm font-semibold capitalize text-brand-foreground">
            {userName}
          </span>
          <span className="mt-1 block truncate text-xs font-normal text-brand-foreground-muted">
            {userEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-brand-border" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
          <Link href={settingsHref}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-3 py-2 text-brand-danger focus:bg-brand-danger/10 focus:text-brand-danger"
          onSelect={() => void signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
