"use client";

import React from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackerToolbar() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your job applications from applied to offer.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-pill px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            className="bg-transparent border-none outline-none text-xs text-gray-600 placeholder:text-gray-400 w-32"
          />
        </div>
        <Button variant="primary" size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add application
        </Button>
      </div>
    </div>
  );
}
