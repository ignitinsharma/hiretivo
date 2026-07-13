import { GenerateResumeShell } from "@/modules/seeker/generate-resume/components/GenerateResumeShell";

/*
 * GenerateResumePage
 * Standalone resume tailoring tool. Lets seekers paste a JD or pick a saved
 * job, then generates a JD-tailored resume + cover letter with match analysis.
 * Renders side-by-side: left controls, right realistic preview.
 */
export default function GenerateResumePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl md:text-3xl leading-snug tracking-tight text-brand-foreground">
        Generate resume
      </h1>
      <GenerateResumeShell />
    </div>
  );
}