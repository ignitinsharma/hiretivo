'use client';

import React from 'react';
import { ChevronRight, Globe2, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';

export function JobDetailHeader() {
  const { openApplyModal } = useUIStore();

  return (
    <>
      <nav className="flex items-center gap-2 mb-8 text-sm font-medium text-slate-500">
        <Link href="/jobs" className="hover:text-primary">Jobs</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/jobs?category=engineering" className="hover:text-primary">Engineering</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Senior Product Designer</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm p-3">
            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-primary font-bold text-2xl">
              A
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Senior Product Designer
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-base">
              <span className="font-semibold text-slate-900">Acme Corp</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>Full-time</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>$140k – $180k</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                <Globe2 className="w-4 h-4 text-green-500" />
                100% Remote
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="outline" className="px-6 py-3 text-sm font-bold text-primary border border-primary/20 hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2 h-auto">
            <Bookmark className="w-5 h-5" />
            Save
          </Button>
          <Button 
            onClick={() => openApplyModal('job-id')}
            className="px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all h-auto"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </>
  );
}