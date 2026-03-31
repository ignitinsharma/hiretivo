'use client';

import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { cn } from '@/lib/utils';

interface MetricCard {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  barColor: string;
  barWidth: string;
  isActive?: boolean;
}

const METRIC_CARDS: MetricCard[] = [
  { label: 'Total', value: '32', badge: 'All', badgeColor: 'text-slate-400 bg-slate-50', barColor: 'bg-slate-300', barWidth: 'w-full', },
  { label: 'Pending', value: '18', badge: '+3 today', badgeColor: 'text-indigo-600 bg-indigo-50', barColor: 'bg-indigo-500', barWidth: 'w-[56%]', isActive: true, },
  { label: 'Reviewed', value: '08', badge: '25%', badgeColor: 'text-blue-500 bg-blue-50', barColor: 'bg-blue-500', barWidth: 'w-[25%]', },
  { label: 'Shortlisted', value: '04', badge: 'Top Tier', badgeColor: 'text-green-500 bg-green-50', barColor: 'bg-green-500', barWidth: 'w-[12%]', },
  { label: 'Rejected', value: '02', badge: 'Closed', badgeColor: 'text-red-500 bg-red-50', barColor: 'bg-red-500', barWidth: 'w-[6%]', },
];

interface Applicant {
  id: string;
  name: string;
  initials: string;
  appliedAgo: string;
  experience: string;
  level: string;
  skills: string[];
  location: string;
  matchPercent: number;
  matchLabel: string;
  matchColor: string;
}

const APPLICANTS_DATA: Applicant[] = [
  {
    id: '1', name: 'Jordan Weaver', initials: 'JW', appliedAgo: '2d ago',
    experience: '8 Years', level: 'Senior Level',
    skills: ['React', 'TypeScript', 'Tailwind'],
    location: 'New York, NY', matchPercent: 94, matchLabel: 'Expert Match',
    matchColor: 'text-indigo-600',
  },
  {
    id: '2', name: 'Sarah Miller', initials: 'SM', appliedAgo: '3d ago',
    experience: '5 Years', level: 'Mid-Senior',
    skills: ['Next.js', 'GraphQL'],
    location: 'San Francisco, CA', matchPercent: 82, matchLabel: 'Strong Match',
    matchColor: 'text-slate-900',
  },
  {
    id: '3', name: 'Marcus Chen', initials: 'MC', appliedAgo: '5d ago',
    experience: '10 Years', level: 'Staff Level',
    skills: ['AWS', 'WASM'],
    location: 'Seattle, WA', matchPercent: 98, matchLabel: 'Perfect Match',
    matchColor: 'text-green-600',
  },
];

function MetricCardComponent({ card }: { card: MetricCard }) {
  return (
    <div
      className={cn(
        'bg-white p-5 rounded-2xl shadow-sm hover:border-slate-300 transition-all cursor-pointer',
        card.isActive
          ? 'border-2 border-indigo-100 bg-indigo-50/10'
          : 'border border-slate-200'
      )}
    >
      <div className="flex flex-col space-y-1">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            card.isActive ? 'text-indigo-500' : 'text-slate-400'
          )}
        >
          {card.label}
        </span>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-extrabold text-slate-900">{card.value}</p>
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', card.badgeColor)}>
            {card.badge}
          </span>
        </div>
        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={cn('h-full', card.barColor, card.barWidth)} />
        </div>
      </div>
    </div>
  );
}

function ApplicantRow({ applicant }: { applicant: Applicant }) {
  return (
    <tr className="group hover:bg-indigo-50/20 cursor-pointer transition-all">
      <td className="px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-xl font-bold text-lg ring-4 ring-slate-50 group-hover:ring-indigo-100 transition-all">
            {applicant.initials}
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
              {applicant.name}
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Applied {applicant.appliedAgo}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{applicant.experience}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
            {applicant.level}
          </span>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex flex-wrap gap-1.5">
          {applicant.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase"
            >
              {skill}
            </span>
          ))}
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center text-sm font-semibold text-slate-600">
          <MapPin className="w-4 h-4 mr-1.5 text-slate-300" />
          {applicant.location}
        </div>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="inline-flex flex-col items-end">
          <span className={cn('font-extrabold text-lg leading-none', applicant.matchColor)}>
            {applicant.matchPercent}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {applicant.matchLabel}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function RecruiterApplicationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <SidebarToggle />
              <nav className="flex items-center text-[10px] font-bold text-indigo-500 tracking-widest uppercase">
                <span>Active Recruitment</span>
                <ChevronRight className="w-3 h-3 mx-1" />
                <span className="text-slate-400">Sr. Frontend Engineer</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Applicants Explorer
              </h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold uppercase tracking-wider">
                32 Candidates
              </span>
            </div>
            <p className="text-base text-slate-500 font-medium">
              Deep-dive candidate analysis and management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 text-slate-700 font-bold text-xs shadow-sm">
              <Download className="w-4 h-4" />
              Export List
            </Button>
            <Button className="gap-2 bg-primary text-white font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Add Candidate
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {METRIC_CARDS.map((card) => (
              <MetricCardComponent key={card.label} card={card} />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Applicant Name
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Exp. Level
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Technical Stack
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    Location
                  </th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {APPLICANTS_DATA.map((applicant) => (
                  <ApplicantRow key={applicant.id} applicant={applicant} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">1-10</span> of 142
              candidates
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-xl border-slate-200 text-slate-400"
                disabled
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex space-x-1">
                <Button
                  size="icon"
                  className="w-10 h-10 rounded-xl bg-primary text-white font-bold shadow-lg shadow-indigo-100"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl border-slate-200 text-slate-600 font-bold"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-xl border-slate-200 text-slate-600 font-bold"
                >
                  3
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-xl border-slate-200 text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
