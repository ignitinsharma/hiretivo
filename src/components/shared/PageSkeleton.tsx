import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  lines?: number;
  showHeader?: boolean;
  showFilters?: boolean;
}

export function PageSkeleton({
  lines = 5,
  showHeader = true,
  showFilters = false,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6 p-6">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}

      {showFilters && (
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
