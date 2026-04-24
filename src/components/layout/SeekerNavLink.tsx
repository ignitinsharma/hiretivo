'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Send } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  send: Send,
};

interface SeekerNavLinkProps {
  href: string;
  iconName: string;
  label: string;
}

export function SeekerNavLink({ href, iconName, label }: SeekerNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICON_MAP[iconName] ?? Briefcase;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 font-bold text-sm transition-colors',
        isActive
          ? 'text-primary border-b-2 border-primary pb-0.5'
          : 'text-slate-600 hover:text-primary'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
