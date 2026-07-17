import React from "react";
import { BrowseJobGrid } from "@/modules/browse/components/BrowseJobGrid";

export default function BrowseJobsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse jobs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover roles that match your skills and experience.
        </p>
      </div>
      <BrowseJobGrid />
    </div>
  );
}
