'use client';

import Image from 'next/image';
import { Bell, Plus, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { useUIStore } from '@/store/use-ui-store';
import { useProfile } from '@/hooks/use-profile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RecruiterHeaderProps {
  title?: string;
  subtitle?: string;
  showPostJob?: boolean;
}

export function RecruiterHeader({
  title,
  subtitle,
  showPostJob = true,
}: RecruiterHeaderProps) {
  const { name: userName, initials, avatarUrl } = useProfile();
  const { openPostJobModal } = useUIStore();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showPostJob && (
          <Button variant="primary" className="gap-2" onClick={openPostJobModal}>
            <Plus className="w-4 h-4" />
            Post a Job
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer">
              <div className="w-8 h-8 bg-brand-primary rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={initials} width={32} height={32} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-0 border-slate-200 rounded-xl shadow-xl">
            <div className="py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-sm text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500">Recruiter</p>
              </div>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
