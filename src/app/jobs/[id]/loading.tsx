import { PageSkeleton } from "@/components/shared/PageSkeleton";

export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      <PageSkeleton lines={6} showHeader={true} showFilters={false} />
    </div>
  );
}
