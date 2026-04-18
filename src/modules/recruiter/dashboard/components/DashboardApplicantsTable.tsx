'use client';

import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ApplicationStatus } from '@/constants/enums';
import { RECENT_APPLICANTS } from '../data/mock-dashboard-data';

const STATUS_STYLES: Record<ApplicationStatus, { label: string; className: string }> = {
  [ApplicationStatus.APPLIED]: {
    label: 'Applied',
    className: 'bg-gray-100 text-gray-700',
  },
  [ApplicationStatus.REVIEWING]: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-700',
  },
  [ApplicationStatus.INTERVIEW]: {
    label: 'Interview',
    className: 'bg-primary/10 text-primary',
  },
  [ApplicationStatus.OFFER]: {
    label: 'Offer',
    className: 'bg-amber-100 text-amber-700',
  },
  [ApplicationStatus.HIRED]: {
    label: 'Hired',
    className: 'bg-green-100 text-green-700',
  },
  [ApplicationStatus.REJECTED]: {
    label: 'Not Selected',
    className: 'bg-red-100 text-red-700',
  },
};

export function DashboardApplicantsTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
          <p className="text-sm text-gray-500">Latest applicants across all jobs</p>
        </div>
        <Button variant="ghost" className="text-brand-primary font-medium">
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Candidate
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Position
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Match
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Applied
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {RECENT_APPLICANTS.map((applicant) => {
              const status = STATUS_STYLES[applicant.status];
              return (
                <tr
                  key={applicant.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary text-sm font-semibold">
                        {applicant.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {applicant.name}
                        </p>
                        <p className="text-xs text-gray-500">{applicant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {applicant.position}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            applicant.matchScore >= 80
                              ? 'bg-green-500'
                              : applicant.matchScore >= 60
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                          )}
                          style={{ width: `${applicant.matchScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {applicant.matchScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(applicant.appliedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
