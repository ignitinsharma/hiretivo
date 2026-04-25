'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sanitizeHtml } from '@/lib/utils/html-sanitizer';

const TABS = ['Overview', 'Responsibilities', 'Qualifications', 'Benefits'] as const;
const HTML_TAG_RE = /<(p|h[1-6]|ul|ol|li|strong|em|br|b|i|u|a)\b[^>]*>/i;

function renderDescription(raw: string): string {
  if (HTML_TAG_RE.test(raw)) {
    return sanitizeHtml(raw);
  }
  const paragraphs = raw.split('\n').filter((p) => p.trim());
  return paragraphs.map((p) => `<p>${p.trim()}</p>`).join('');
}

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
  const descriptionHtml = useMemo(() => renderDescription(job.description), [job.description]);

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
            <div
              className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </section>
        )}

        {activeTab === 'Responsibilities' && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Key Responsibilities</h3>
            <div
              className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
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
