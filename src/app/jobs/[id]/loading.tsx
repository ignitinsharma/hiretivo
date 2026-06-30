import { Skeleton } from '@/components/ui/skeleton';

/*
 * JobDetailLoading
 * Skeleton that mirrors the real page layout: breadcrumb → header (logo + title + meta)
 * → content tabs → description blocks + sidebar. Prevents the full-blank-page flash.
 */
export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header nav placeholder */}
      <div className="h-16 bg-white border-b border-brand-border" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-2" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Job header: logo + title + meta + apply button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-64 md:w-96" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>

        {/* Body: content + sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-brand-border mb-6">
              <Skeleton className="h-5 w-20 mb-3" />
              <Skeleton className="h-5 w-28 mb-3" />
            </div>

            {/* Description blocks */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="space-y-3 mt-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="space-y-2 mt-6">
              <Skeleton className="h-5 w-36" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
