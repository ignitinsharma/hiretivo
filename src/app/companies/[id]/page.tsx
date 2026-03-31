import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CompanyHeader } from '@/modules/companies/components/CompanyHeader';
import { CompanyAbout } from '@/modules/companies/components/CompanyAbout';
import { CompanyPerks } from '@/modules/companies/components/CompanyPerks';
import { CompanyJobs } from '@/modules/companies/components/CompanyJobs';
import { CompanySidebar } from '@/modules/companies/components/CompanySidebar';

export default function CompanyProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyHeader />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-8 w-full">
            <CompanyAbout />
            <CompanyPerks />
            <CompanyJobs />
          </div>
          
          <CompanySidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}