'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TABS = ['Overview', 'Responsibilities', 'Qualifications', 'Benefits'];

interface JobData {
  id: string;
  title: string;
  description: string;
  skills: Array<{ id: string; name: string; slug: string; level: string }>;
  companyName: string;
}

interface JobDetailContentProps {
  job: JobData;
}

export function JobDetailContent({ job }: JobDetailContentProps) {
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
        {activeTab === 'Overview' && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">About the Role</h3>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
              {job.description.split('\n').filter((p) => p.trim()).map((paragraph, idx) => (
                <p key={idx}>{paragraph.trim()}</p>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Responsibilities' && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Key Responsibilities</h3>
            <ul className="space-y-3">
              {job.description.split('\n').filter((p) => p.trim()).map((item, idx) => (
                <li key={idx} className="flex gap-3 text-slate-600">
                  <CheckCircle2 className="text-primary mt-0.5 w-5 h-5 shrink-0" />
                  <span>{item.trim()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'Qualifications' && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="text-sm font-medium">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Benefits' && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Benefits</h3>
            <p className="text-slate-600">Contact the recruiter for details about benefits and compensation.</p>
          </section>
        )}

        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-bold">
              {job.companyName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{job.companyName}</p>
            </div>
            <Link
              href={`/companies/${job.id}`}
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
