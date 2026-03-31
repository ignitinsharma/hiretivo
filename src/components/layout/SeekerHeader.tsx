'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEEKER_NAV_ITEMS } from '@/constants/nav';
import { Button } from '@/components/ui/button';

export function SeekerHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
            H
          </div>
          <h2 className="text-slate-900 text-xl font-extrabold tracking-tight">
            Hiretivo
          </h2>
        </div>

        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {SEEKER_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-medium text-sm transition-colors',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-slate-600 hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="icon-ghost" size="icon-sm" className="bg-slate-100 rounded-xl">
            <Bell className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="relative cursor-pointer flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-transparent transition-all group-hover:border-primary">
                NS
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}