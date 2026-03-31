'use client';

import { useState } from 'react';
import {
  Plus,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Palette,
  Code,
  Brush,
  Landmark,
  TrendingUp,
  MapPin,
  Building2,
  Globe,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Pencil,
  Archive,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

interface JobStatItem {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
}

const JOB_STATS: JobStatItem[] = [
  { label: 'Total Listings', value: '24', badge: '+2 New', badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Avg. Time to Hire', value: '18d', badge: '-4d Trend', badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Total Applicants', value: '1,402', badge: '+12% Vol', badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Talent Score Avg.', value: '8.4', badge: '', badgeColor: '' },
];

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  applicants: number;
  applicantBadge: string;
  applicantBadgeColor: string;
  postedDate: string;
  hasFocus?: boolean;
}

const JOB_LISTINGS: JobListing[] = [
  {
    id: '1', title: 'Senior UX Designer', department: 'Design', location: 'London / Remote',
    icon: Palette, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
    applicants: 92, applicantBadge: '+5 New', applicantBadgeColor: 'text-indigo-600',
    postedDate: 'Oct 14, 2023', hasFocus: true,
  },
  {
    id: '2', title: 'Senior Full Stack Engineer', department: 'Engineering', location: 'Remote',
    icon: Code, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
    applicants: 148, applicantBadge: '+12 Today', applicantBadgeColor: 'text-emerald-600',
    postedDate: 'Oct 12, 2023',
  },
  {
    id: '3', title: 'Principal Product Designer', department: 'Design', location: 'London, UK',
    icon: Brush, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
    applicants: 84, applicantBadge: 'Steady', applicantBadgeColor: 'text-slate-400',
    postedDate: 'Oct 08, 2023',
  },
  {
    id: '4', title: 'VP of Finance', department: 'Finance', location: 'Remote',
    icon: Landmark, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
    applicants: 32, applicantBadge: '+4 New', applicantBadgeColor: 'text-emerald-600',
    postedDate: 'Oct 05, 2023',
  },
  {
    id: '5', title: 'Head of Growth Marketing', department: 'Marketing', location: 'New York, USA',
    icon: TrendingUp, iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
    applicants: 212, applicantBadge: 'Sourcing', applicantBadgeColor: 'text-slate-400',
    postedDate: 'Oct 01, 2023',
  },
];

function JobStatCard({ stat }: { stat: JobStatItem }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">
        {stat.label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900">{stat.value}</span>
        {stat.badge && (
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', stat.badgeColor)}>
            {stat.badge}
          </span>
        )}
        {stat.label === 'Talent Score Avg.' && (
          <div className="w-full max-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden self-center">
            <div className="bg-primary h-full" style={{ width: '84%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({ job }: { job: JobListing }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const IconComp = job.icon;

  return (
    <tr className="hover:bg-indigo-50/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', job.iconBg)}>
            <IconComp className={cn('w-5 h-5', job.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-sm">{job.title}</p>
              {job.hasFocus && (
                <span className="text-[10px] bg-primary text-white px-1.5 rounded-sm font-bold uppercase tracking-tighter">
                  Active Focus
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {job.department}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="inline-block">
          <p className="font-bold text-slate-900 text-sm">{job.applicants}</p>
          <p className={cn('text-[10px] font-bold', job.applicantBadgeColor)}>
            {job.applicantBadge}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-[11px] text-slate-600 font-medium">{job.postedDate}</p>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-4 py-1.5 border-indigo-200 text-indigo-700 hover:bg-primary hover:text-white text-[11px] font-bold h-auto"
          >
            View Talent
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-900"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1.5 overflow-hidden ring-4 ring-black/5">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Pencil className="w-4 h-4" />
                  Edit Job
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Archive className="w-4 h-4" />
                  Archive Job
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Job
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function RecruiterJobsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="w-full p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
          <div className="flex items-start gap-4">
            <SidebarToggle className="mt-2" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Active Jobs
                </h1>
              </div>
              <p className="text-slate-500 text-lg">
                Curate and manage your active job listings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 border-slate-200">
              <Upload className="w-4 h-4" />
              Export
            </Button>
            <Button className="bg-primary text-white gap-2 shadow-md shadow-indigo-100 hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {JOB_STATS.map((stat) => (
            <JobStatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              className="w-full pl-9 bg-slate-50 border-slate-200 text-sm"
              placeholder="Quick search listings..."
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Department: All</option>
              <option>Engineering</option>
              <option>Design</option>
              <option>Finance</option>
            </select>
            <select className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option>Status: Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary bg-indigo-50 border border-indigo-200">
              <List className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Applicants
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Posted Date
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {JOB_LISTINGS.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">1-5</span> of{' '}
              <span className="text-slate-900 font-bold">24</span> active listings
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button size="icon" className="h-7 w-7 bg-primary text-white text-[11px] font-bold shadow-sm shadow-indigo-100">
                1
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 text-[11px] font-medium border-slate-200">
                2
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 text-[11px] font-medium border-slate-200">
                3
              </Button>
              <span className="w-7 h-7 flex items-center justify-center text-slate-400 text-[11px]">
                ...
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7 text-[11px] font-medium border-slate-200">
                6
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
