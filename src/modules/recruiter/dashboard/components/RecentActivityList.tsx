'use client';

import { UserPlus, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { RECENT_ACTIVITY } from '../data/mock-dashboard-data';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS = {
  application: UserPlus,
  interview: Calendar,
  shortlist: CheckCircle,
  rejection: XCircle,
};

const ACTIVITY_STYLES = {
  application: 'bg-blue-100 text-blue-600',
  interview: 'bg-purple-100 text-purple-600',
  shortlist: 'bg-brand-primary-light text-brand-primary',
  rejection: 'bg-red-100 text-red-600',
};

export function RecentActivityList() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        <p className="text-sm text-gray-500">Latest updates from your postings</p>
      </div>

      <div className="p-3">
        {RECENT_ACTIVITY.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          return (
            <div
              key={activity.id}
              className={cn(
                'p-3 rounded-lg hover:bg-gray-50 transition-colors',
                index !== RECENT_ACTIVITY.length - 1 ? 'mb-2' : ''
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    ACTIVITY_STYLES[activity.type]
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.candidateName}</span>{' '}
                    applied for{' '}
                    <span className="font-medium text-brand-primary">
                      {activity.jobTitle}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
