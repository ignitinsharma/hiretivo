'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function NavLink({ href, label, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        'font-semibold text-sm transition-colors',
        isActive
          ? 'text-brand-primary font-semibold'
          : 'text-muted-foreground hover:text-black',
        className
      )}
    >
      {label}
    </Link>
  );
}
