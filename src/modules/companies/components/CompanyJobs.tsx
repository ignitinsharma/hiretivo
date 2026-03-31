import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const OPEN_POSITIONS = [
  {
    id: '1',
    title: 'Senior Product Designer',
    type: 'Full-time',
    exp: '5+ years exp',
    salary: '$140k – $180k',
  },
  {
    id: '2',
    title: 'Full Stack Engineer (React/Node)',
    type: 'Full-time',
    exp: '3+ years exp',
    salary: '$130k – $170k',
  },
  {
    id: '3',
    title: 'Growth Marketing Manager',
    type: 'Full-time',
    exp: 'Mid-level',
    salary: '$110k – $150k',
  },
  {
    id: '4',
    title: 'Customer Success Lead',
    type: 'Full-time',
    exp: 'Senior',
    salary: '$90k – $130k',
  },
];

export function CompanyJobs() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Open Positions</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          8 roles
        </span>
      </div>
      
      <div className="divide-y divide-slate-100">
        {OPEN_POSITIONS.map((job) => (
          <div key={job.id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-5 first:pt-0 last:pb-0 gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {job.type}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {job.exp}
                </span>
                <span className="text-sm font-semibold text-emerald-600">{job.salary}</span>
              </div>
            </div>
            <Link href={`/jobs/${job.id}`} className="flex items-center gap-1 text-sm font-bold text-primary shrink-0">
              View <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}