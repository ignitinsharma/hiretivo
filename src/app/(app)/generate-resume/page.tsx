import { GenerateResumeShell } from "@/modules/seeker/generate-resume/components/GenerateResumeShell";

export default function GenerateResumePage({
  searchParams,
}: {
  searchParams?: { jobId?: string; applicationId?: string };
}) {
  const jobId = searchParams?.jobId || undefined;
  const applicationId = searchParams?.applicationId || undefined;

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl md:text-3xl leading-snug tracking-tight text-brand-foreground">
        Generate resume
      </h1>
      <GenerateResumeShell jobId={jobId} applicationId={applicationId} />
    </div>
  );
}
