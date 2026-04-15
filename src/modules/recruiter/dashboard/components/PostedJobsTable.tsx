'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobStatus } from '@/constants/enums';
import { POSTED_JOBS } from '../data/mock-dashboard-data';
import { cn } from '@/lib/utils';

const JOB_STATUS_STYLES: Record<JobStatus, { label: string; className: string }> = {
  [JobStatus.OPEN]: { label: 'Active', className: 'bg-green-100 text-green-700' },
  [JobStatus.UNPUBLISHED]: { label: 'Unpublished', className: 'bg-yellow-100 text-yellow-700' },
  [JobStatus.DELETED]: { label: 'Deleted', className: 'bg-red-100 text-red-700' },
};

export function PostedJobsTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Posted Jobs</h2>
          <p className="text-sm text-gray-500">Manage your active job postings</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Job Title
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Applicants
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Matches
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {POSTED_JOBS.map((job) => {
              const status = JOB_STATUS_STYLES[job.status];
              return (
                <tr
                  key={job.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.department}</p>
                    </div>
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
                  <td className="px-5 py-4 text-sm text-gray-600">{job.applicants}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-brand-primary">
                      {job.matches}
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
