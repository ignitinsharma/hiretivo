"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Briefcase } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { applicationService } from "@/services/application.service"
import { ApplicationCard } from "./ApplicationCard"
import { ApplicationListSkeleton } from "./ApplicationListSkeleton"
import type { SeekerApplicationItem } from "../types/application.types"

/*
 * ApplicationList
 * Shows seeker applications in two tabs:
 * "My Applications" (SEEKER_APPLIED) and "Recruiter Invites" (RECRUITER_INITIATED).
 * Fetches from GET /api/applications which returns source field per application.
 */
export function ApplicationList() {
  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: applicationService.getMyApplications,
  })

  if (isLoading) return <ApplicationListSkeleton />

  if (isError) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-lg font-bold text-brand-foreground">Couldn&apos;t load your applications</h3>
        <p className="mt-2 text-brand-foreground-muted">Please refresh and try again.</p>
      </Card>
    )
  }

  const myApplications = applications.filter(a => a.source !== 'RECRUITER_INITIATED')
  const recruiterInvites = applications.filter(a => a.source === 'RECRUITER_INITIATED')

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
          Applications
        </h1>
        <p className="text-base text-brand-foreground-muted">
          Track your applications and recruiter invites in one place.
        </p>
      </div>

      <Tabs defaultValue="my-applications">
        <TabsList className="mb-6">
          <TabsTrigger value="my-applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Applications
            {myApplications.length > 0 && (
              <span className="ml-1 rounded-full bg-brand-surface border border-brand-border px-2 py-0.5 text-xs font-medium text-brand-foreground-muted">
                {myApplications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recruiter-invites" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Recruiter Invites
            {recruiterInvites.length > 0 && (
              <span className="ml-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 text-xs font-medium text-brand-primary">
                {recruiterInvites.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-applications">
          <ApplicationTabContent
            applications={myApplications}
            emptyTitle="No applications yet"
            emptyMessage="You haven't applied to any jobs yet. Start exploring!"
          />
        </TabsContent>

        <TabsContent value="recruiter-invites">
          <ApplicationTabContent
            applications={recruiterInvites}
            emptyTitle="No recruiter invites yet"
            emptyMessage="When recruiters invite you to apply, they'll appear here."
            isInvites
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TabContentProps {
  applications: SeekerApplicationItem[]
  emptyTitle: string
  emptyMessage: string
  isInvites?: boolean
}

function ApplicationTabContent({ applications, emptyTitle, emptyMessage, isInvites }: TabContentProps) {
  if (applications.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-surface">
          <FileText className="h-7 w-7 text-brand-foreground-secondary" />
        </div>
        <h3 className="text-lg font-bold text-brand-foreground">{emptyTitle}</h3>
        <p className="mt-2 text-brand-foreground-muted">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} isInvite={isInvites} />
      ))}
    </div>
  )
}
