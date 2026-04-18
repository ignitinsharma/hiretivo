import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SidebarToggle } from '@/components/layout/RecruiterSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobAnalyticsTab } from '@/modules/recruiter/jobs/components/JobAnalyticsTab';

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
      <div className="min-h-screen bg-white">
        <main className="w-full p-8">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full p-8">
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
            <p className="text-slate-500 text-sm">
              Job overview and management coming soon.
            </p>
          </TabsContent>

          <TabsContent value="analytics">
            <JobAnalyticsTab jobId={id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
