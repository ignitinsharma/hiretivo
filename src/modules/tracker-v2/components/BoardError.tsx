"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

export function BoardError() {
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-brand-foreground">
        Could not load applications
      </h3>
      <p className="text-sm text-brand-foreground-muted mt-1 mb-4">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={() => queryClient.invalidateQueries({ queryKey: ["applications"] })}
        className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
