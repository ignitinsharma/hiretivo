import { SavedJobsList } from "@/modules/seeker/saved-jobs/components/SavedJobsList";

export default function SavedJobsPage() {
  return (
    <main className="min-h-screen">
      <div className="mb-8 flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-foreground md:text-4xl">
            Saved jobs
          </h1>
          <p className="mt-2 text-base text-brand-foreground-muted">
            Keep high-fit roles ready for later applications.
          </p>
        </div>
      </div>
      <SavedJobsList />
    </main>
  );
}
