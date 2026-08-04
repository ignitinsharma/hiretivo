import { Skeleton } from "@/components/ui/skeleton";

export function ResumeSkeleton() {
  return (
    <div className="rounded-xl border border-brand-border bg-white overflow-hidden">
      <div className="space-y-5 p-8 min-h-[900px]">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-3 w-3/4" />
        <div className="pt-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="pt-3 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2 pl-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="pt-3 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2 pl-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="pt-3 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
