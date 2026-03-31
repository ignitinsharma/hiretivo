'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';

const SIMILAR_JOBS = [
  { id: '1', title: 'Product Designer', company: 'Stripe', salary: '$130k-170k', tag: 'Higher Match', tagClass: 'bg-green-50 text-green-600' },
  { id: '2', title: 'Design Engineer', company: 'Clerk', salary: '$140k-190k', tag: 'New', tagClass: 'bg-slate-100 text-slate-500' },
  { id: '3', title: 'Lead Product Designer', company: 'Figma', salary: '$160k-210k', tag: null, tagClass: '' },
];

export function JobDetailSidebar() {
  const { openApplyModal } = useUIStore();

  return (
    <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-24 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Quick Apply</h3>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded leading-none">
            Actively Hiring
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Posted</p>
            <p className="text-sm font-bold">2d ago</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Applicants</p>
            <p className="text-sm font-bold">45</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => openApplyModal('job-id')}
            className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 h-auto"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full py-3 text-sm font-bold text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all h-auto">
            Save for later
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-center text-slate-500">
          Average response time: <span className="font-semibold text-slate-700">24 hours</span>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Compare Similar</h3>
          <span className="text-xs font-medium text-primary">6 Available</span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="p-4 bg-primary/5 border-l-4 border-primary">
            <div className="flex gap-3 mb-2">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-primary font-bold text-xs shrink-0">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">Senior Product Designer</p>
                <p className="text-[10px] text-slate-500">Acme Corp • $140k-180k</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded">Current</span>
            </div>
          </div>

          {SIMILAR_JOBS.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="p-4 block hover:bg-slate-50 transition-colors group">
              <div className="flex gap-3 mb-2">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary line-clamp-1 transition-colors">
                    {job.title}
                  </p>
                  <p className="text-[10px] text-slate-500">{job.company} • {job.salary}</p>
                </div>
              </div>
              {job.tag && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 ${job.tagClass} text-[10px] font-bold rounded`}>
                    {job.tag}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="p-4">
          <Button variant="ghost" className="w-full py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors h-auto">
            View All Engineering Roles
          </Button>
        </div>
      </div>
    </aside>
  );
}