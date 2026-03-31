'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TABS = ['Overview', 'Responsibilities', 'Qualifications', 'Benefits'];

export function JobDetailContent() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 px-6 sm:px-8">
        <nav className="flex gap-8 -mb-px">
          {TABS.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              className={`py-5 px-0 h-auto rounded-none text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary hover:text-primary hover:bg-transparent'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-transparent'
              }`}
            >
              {tab}
            </Button>
          ))}
        </nav>
      </div>

      <div className="p-6 sm:p-8 space-y-10">
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">About the Role</h3>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
            <p>
              We are looking for a visionary Senior Product Designer to join our core team. You will lead the design direction for our flagship products, ensuring a seamless and delightful user experience across all platforms. You'll collaborate closely with engineering and product management to turn complex problems into elegant solutions.
            </p>
            <p>
              At Acme Corp, we value craft, curiosity, and extreme ownership. You'll be joining at a pivotal time as we scale our design system and rethink how people interact with financial data globally.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Key Responsibilities</h3>
          <ul className="space-y-3">
            {[
              'Design end-to-end user journeys from concept to high-fidelity execution.',
              'Facilitate design workshops and lead user research sessions to validate core hypotheses.',
              'Maintain and evolve our design system, Orbit, ensuring consistency across Web and Mobile.',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600">
                <CheckCircle2 className="text-primary mt-0.5 w-5 h-5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div>
              <p className="font-bold text-slate-900">Acme Corp</p>
              <p className="text-sm text-slate-500">Series B • Fintech • 50-100 Employees</p>
            </div>
            <Link
              href="/companies/acme"
              className="ml-auto text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              Visit Profile <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}