'use client';

import React from 'react';
import { Filter, Download } from 'lucide-react';
import { MOCK_APPLICATIONS } from '../data/mock-applications';
import { ApplicationCard } from './ApplicationCard';
import { Button } from '@/components/ui/button';

export function ApplicationList() {
  const applications = MOCK_APPLICATIONS;

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">No applications yet</h3>
        <p className="text-slate-500 mt-2">
          You haven't applied to any jobs yet. Start exploring!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 text-3xl md:text-4xl font-extrabold tracking-tight">
            My Applications
          </h1>
          <p className="text-slate-500 text-base">
            You have submitted applications to {applications.length} companies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="muted-outline" size="sm" className="flex items-center gap-2 rounded-lg font-semibold transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="brand" size="sm" className="flex items-center gap-2 rounded-lg font-bold transition-all">
            <Download className="w-4 h-4" />
            Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
}