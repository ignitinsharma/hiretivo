import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JobDetailHeader } from '@/modules/jobs/components/JobDetailHeader';
import { JobDetailContent } from '@/modules/jobs/components/JobDetailContent';
import { JobDetailSidebar } from '@/modules/jobs/components/JobDetailSidebar';

export default function JobDescriptionPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDetailHeader />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <JobDetailContent />
          <JobDetailSidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}