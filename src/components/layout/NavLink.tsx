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
        'font-medium text-sm transition-colors',
        isActive
          ? 'text-brand-primary font-semibold'
          : 'text-brand-body hover:text-brand-primary',
        className
      )}
    >
      {label}
    </Link>
  );
}
