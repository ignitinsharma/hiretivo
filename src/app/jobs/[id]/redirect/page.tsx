import React from "react";
import { ExternalLink, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { prisma } from "@/lib/prisma";
import { ApplyType, JobStatus } from "@/constants/enums";
import { appendHiretivoAttributionParams } from "@/lib/url/utm";
import { ExternalApplyConfirmationDialog } from "@/components/shared/ExternalApplyConfirmationDialog";

interface ExternalRedirectionPageProps {
  params: { id: string };
}

export default async function ExternalRedirectionPage({
  params,
}: ExternalRedirectionPageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.id, status: JobStatus.OPEN },
    select: {
      title: true,
      applyType: true,
      externalApplyUrl: true,
      companyName: true,
    },
  });

  const companyName = job?.companyName ?? 'the employer';
  const canRedirectExternally =
    job?.applyType === ApplyType.EXTERNAL && !!job.externalApplyUrl;
  const trackedUrl =
    canRedirectExternally && job.externalApplyUrl
      ? appendHiretivoAttributionParams(job.externalApplyUrl)
      : null;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        <section className="bg-white border border-brand-border-light  rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <ExternalLink className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            You&apos;re heading to {companyName}&apos;s site
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8 px-2">
            {canRedirectExternally
              ? "Hiretivo helps you find the job, but the application happens on their platform. Good luck!"
              : "This role does not support external applications right now. Please go back and use the standard application flow."}
          </p>

          <div className="space-y-4">
            {trackedUrl ? (
              <ExternalApplyConfirmationDialog
                jobId={params.id}
                externalUrl={trackedUrl}
                companyName={companyName}
              />
            ) : (
              <Link
                href={`/jobs/${params.id}`}
                className="block w-full rounded-full bg-brand-primary px-6 py-3.5 font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                Back to Job
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="block w-full font-medium transition-colors"
            >
              <Link href={`/jobs/${params.id}`}>Go Back</Link>
            </Button>
          </div>

          <div className="mt-10">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3">
              Redirecting in <span>5</span> seconds
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full origin-left"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Secure redirection to verified partner
          </p>
        </footer>
      </main>
    </div>
  );
}
