import { Suspense } from 'react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobAnalyticsTab } from '@/modules/recruiter/jobs/components/JobAnalyticsTab';
import { BoostJobButton } from '@/modules/recruiter/jobs/components/BoostJobButton';
import { BoostSuccessNotifier } from '@/modules/recruiter/jobs/components/BoostSuccessNotifier';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecruiterJobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const job = await prisma.job.findUnique({
    where: { id },
    select: { title: true, recruiterId: true },
  });

  if (!job || job.recruiterId !== session?.user?.id) {
    return (
      <div className="w-full p-8">
        <div className="flex items-start gap-4 mb-10">
          <SidebarToggle className="mt-2" />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Job not found
            </h1>
            <p className="text-slate-500 text-lg mt-1">
              This job does not exist or you do not have access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // INT-03: Fetch active boost status for this job
  const activeBoost = await prisma.boostedJob.findUnique({
    where: { jobId: id },
    select: { expiresAt: true },
  });
  const now = new Date();
  const isAlreadyBoosted = activeBoost !== null && activeBoost.expiresAt > now;
  const boostExpiresAt = isAlreadyBoosted ? activeBoost.expiresAt.toISOString() : null;

  return (
    <div className="w-full p-8">
      {/* Boost success toast — fires when returning from DodoPayments with ?boost=success */}
      <Suspense fallback={null}>
        <BoostSuccessNotifier />
      </Suspense>

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <SidebarToggle className="mt-2" />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            {job.title}
          </h1>
          <p className="text-slate-500 text-lg mt-1">
            Job details and performance analytics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="max-w-sm pt-2">
            <BoostJobButton
              jobId={id}
              isAlreadyBoosted={isAlreadyBoosted}
              boostExpiresAt={boostExpiresAt}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <JobAnalyticsTab jobId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
