'use client';

import { Calendar, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UPCOMING_INTERVIEWS } from '../data/mock-dashboard-data';

export function UpcomingInterviewsList() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Upcoming Interviews</h2>
          <p className="text-sm text-gray-500">Scheduled for this week</p>
        </div>
      </div>

      <div className="p-3">
        {UPCOMING_INTERVIEWS.map((interview, index) => (
          <div
            key={interview.id}
            className={`p-3 rounded-lg hover:bg-gray-50 transition-colors ${
              index !== UPCOMING_INTERVIEWS.length - 1 ? 'mb-2' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {interview.candidateName}
                </p>
                <p className="text-xs text-gray-500">{interview.position}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {interview.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {interview.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100">
        <Button variant="ghost" className="w-full text-brand-primary font-medium">
          View All Interviews
        </Button>
      </div>
    </div>
  );
}
