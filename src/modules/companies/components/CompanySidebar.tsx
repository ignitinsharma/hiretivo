import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CompanySidebar() {
  return (
    <div className="flex flex-col gap-8 w-full lg:w-80 shrink-0">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Company Quick Facts</h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="text-sm text-slate-500">Industry</span>
            <span className="text-sm font-semibold text-slate-900">Software / SaaS</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="text-sm text-slate-500">Size</span>
            <span className="text-sm font-semibold text-slate-900">51–200 employees</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="text-sm text-slate-500">Headquarters</span>
            <span className="text-sm font-semibold text-slate-900">San Francisco, CA</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="text-sm text-slate-500">Founded</span>
            <span className="text-sm font-semibold text-slate-900">2018</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="text-sm text-slate-500">Website</span>
            <a href="#" className="text-sm font-semibold text-primary hover:underline">acmecorp.com</a>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-sm text-slate-500">Open roles</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">8 active</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Is this your company?</h2>
        <p className="mb-6 text-sm text-slate-500">
          Claim this profile to manage your listing, respond to reviews, and post unlimited job openings.
        </p>
        <Button variant="brand-outline" size="full" className="rounded-xl font-bold transition-all">
          Claim Profile
        </Button>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="h-40 w-full bg-slate-200 flex items-center justify-center text-slate-400">
          <MapPin className="w-10 h-10" />
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Hub</p>
          <p className="text-sm text-slate-900 font-semibold">Market Street, San Francisco</p>
        </div>
      </div>
    </div>
  );
}