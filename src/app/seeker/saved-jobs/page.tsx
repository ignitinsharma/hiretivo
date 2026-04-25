import { Bookmark } from "lucide-react";

import { SavedJobsList } from "@/modules/seeker/saved-jobs/components/SavedJobsList";

export default function SavedJobsPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(89,82,229,0.1)] text-[#5952e5]">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[40px] font-black leading-[0.85] text-[#0e0f0c] [font-feature-settings:'calt']">
              Saved jobs
            </h1>
            <p className="mt-2 text-[18px] font-normal leading-[1.44] tracking-[0.18px] text-[#454745] [font-feature-settings:'calt']">
              Keep high-fit roles ready for later applications.
            </p>
          </div>
        </div>
        <SavedJobsList />
      </div>
    </main>
  );
}
