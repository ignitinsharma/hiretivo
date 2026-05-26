/*
 * PipelinePage
 * Server component rendering the recruiter pipeline at /recruiter/pipeline.
 * Wraps the kanban board and analytics in a two-tab layout (Pipeline + Analytics).
 * Auth is enforced by the parent recruiter layout's AuthGuard.
 * isFreePlan is computed server-side from session.user.plan and will be
 * forwarded to the AnalyticsTab island (added in Plan 03).
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { PlanTier } from "@/constants/enums";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineBoard } from "./PipelineBoard";
import { AnalyticsTab } from "./AnalyticsTab";

export default async function PipelinePage() {
  const session = await auth();
  const isFreePlan = session?.user?.plan === PlanTier.FREE;

  return (
    <div className="w-full p-8 space-y-6">
      {/* Back link */}
      <Link
        href="/recruiter/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-brand-foreground-muted hover:text-brand-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div>
        <h1 className="font-bold text-3xl md:text-4xl leading-tight tracking-tight text-brand-foreground">
          Candidate Pipeline
        </h1>
        <p className="mt-2 text-brand-foreground-muted text-base">
          Manage application statuses across all your jobs
        </p>
      </div>

      {/* Tab container: Pipeline + Analytics */}
      <Tabs defaultValue="pipeline">
        <TabsList className="mb-6">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineBoard />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab isFreePlan={isFreePlan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

