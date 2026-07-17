import React from "react";
import { BarChart3 } from "lucide-react";

export function EmptyAnalyticsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-pill bg-gray-100 flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700">Not enough data</h3>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">
        Add more applications to see your hiring analytics and trends.
      </p>
    </div>
  );
}
