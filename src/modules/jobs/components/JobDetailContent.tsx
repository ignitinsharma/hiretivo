'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sanitizeHtml } from '@/lib/utils/html-sanitizer';

const HTML_TAG_RE = /<(p|h[1-6]|ul|ol|li|strong|em|br|b|i|u|a)\b[^>]*>/i;

type JobContentTab = 'Overview' | 'Responsibilities' | 'Qualifications' | 'Benefits';

interface ContentSection {
  tab: JobContentTab;
  title: string;
  html: string;
}

const SECTION_MARKERS: Array<{ tab: JobContentTab; pattern: RegExp }> = [
  { tab: 'Responsibilities', pattern: /^(key\s+)?responsibilit(?:y|ies)\s*:?\s*$/i },
  { tab: 'Qualifications', pattern: /^(required\s+)?(skills|qualifications|requirements)\s*:?\s*$/i },
  { tab: 'Benefits', pattern: /^(benefits|perks|compensation\s+and\s+benefits)\s*:?\s*$/i },
  { tab: 'Overview', pattern: /^(overview|about\s+(the\s+)?role|job\s+description)\s*:?\s*$/i },
];

function renderDescription(raw: string): string {
  if (HTML_TAG_RE.test(raw)) {
    return sanitizeHtml(raw);
  }
  const paragraphs = raw.split('\n').filter((p) => p.trim());
  return paragraphs.map((p) => `<p>${p.trim()}</p>`).join('');
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getMarkerTab(line: string): JobContentTab | null {
  const normalized = line.trim().replace(/^\*\*|\*\*$/g, '');
  return SECTION_MARKERS.find((marker) => marker.pattern.test(normalized))?.tab ?? null;
}

function renderLines(lines: string[]): string {
  const cleanedLines = lines.map((line) => line.trim()).filter(Boolean);
  if (cleanedLines.length === 0) return '';

  return cleanedLines
    .map((line) => {
      const listItem = line.match(/^[-*•]\s*(.+)$/);
      if (listItem) return `<p>- ${listItem[1].trim()}</p>`;
      return `<p>${line}</p>`;
    })
    .join('');
}

function buildContentSections(description: string): ContentSection[] {
  const source = HTML_TAG_RE.test(description) ? stripHtml(description) : description;
  const lines = source.split(/\r?\n/);
  const buckets: Record<JobContentTab, string[]> = {
    Overview: [],
    Responsibilities: [],
    Qualifications: [],
    Benefits: [],
  };
  let activeTab: JobContentTab = 'Overview';
  let foundMarker = false;

  lines.forEach((line) => {
    const markerTab = getMarkerTab(line);
    if (markerTab) {
      activeTab = markerTab;
      foundMarker = true;
      return;
    }

    buckets[activeTab].push(line);
  });

  if (!foundMarker) {
    return [
      {
        tab: 'Overview',
        title: 'About the Role',
        html: renderDescription(description),
      },
    ];
  }

  const sections: ContentSection[] = [
    { tab: 'Overview', title: 'About the Role', html: renderLines(buckets.Overview) },
    { tab: 'Responsibilities', title: 'Key Responsibilities', html: renderLines(buckets.Responsibilities) },
    { tab: 'Qualifications', title: 'Required Skills', html: renderLines(buckets.Qualifications) },
    { tab: 'Benefits', title: 'Benefits', html: renderLines(buckets.Benefits) },
  ];

  return sections.filter((section) => section.html.trim().length > 0);
}

interface JobData {
  id: string;
  title: string;
  description: string;
  skills: Array<{ id: string; name: string; slug: string; level: string }>;
  companyName: string;
  companyLogoUrl: string | null;
  companyId: string | null;
}

interface JobDetailContentProps {
  job: JobData;
}

export function JobDetailContent({ job }: JobDetailContentProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const sections = useMemo(() => {
    const contentSections = buildContentSections(job.description);
    const hasQualifications = contentSections.some((section) => section.tab === 'Qualifications');

    if (!hasQualifications && job.skills.length > 0) {
      return [
        ...contentSections,
        { tab: 'Qualifications' as const, title: 'Required Skills', html: '' },
      ];
    }

    return contentSections;
  }, [job.description, job.skills.length]);
  const visibleTabs = sections.map((section) => section.tab);
  const selectedTab = visibleTabs.includes(activeTab as JobContentTab)
    ? (activeTab as JobContentTab)
    : visibleTabs[0];
  const activeSection = sections.find((section) => section.tab === selectedTab) ?? sections[0];

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {sections.length > 1 && (
        <div className="border-b border-slate-200 px-6 sm:px-8">
          <nav className="flex gap-8 -mb-px overflow-x-auto">
            {visibleTabs.map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={`py-5 px-0 h-auto rounded-none text-sm font-bold border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-primary text-primary hover:text-primary hover:bg-transparent'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-transparent'
                }`}
              >
                {tab}
              </Button>
            ))}
          </nav>
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-10">
        {activeSection && (
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4">{activeSection.title}</h3>
            <div
              className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeSection.html) }}
            />
            {activeSection.tab === 'Qualifications' && job.skills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-sm font-medium">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-bold overflow-hidden border border-slate-200">
              {job.companyLogoUrl ? (
                <Image
                  src={job.companyLogoUrl}
                  alt={`${job.companyName} logo`}
                  width={48}
                  height={48}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                job.companyName.charAt(0)
              )}
            </div>
            <div>
              <p className="font-bold text-slate-900">{job.companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
