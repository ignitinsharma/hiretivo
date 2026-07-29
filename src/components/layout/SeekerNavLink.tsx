'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SeekerNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function SeekerNavLink({ href, icon: Icon, label }: SeekerNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 font-bold text-sm transition-colors',
        isActive
          ? 'text-primary border-b-2 border-primary pb-0.5'
          : 'text-brand-foreground-muted hover:text-primary'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
