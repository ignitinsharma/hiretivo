'use client';

import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecruiterHeaderProps {
  title: string;
  subtitle?: string;
  showPostJob?: boolean;
}

export function RecruiterHeader({
  title,
  subtitle,
  showPostJob = true,
}: RecruiterHeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showPostJob && (
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            Post a Job
          </Button>
        )}

        <button className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
            AC
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
