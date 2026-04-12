import React from "react";
import { Button } from "@/components/ui/button";

export function DangerZoneSection() {
  return (
    <section
      id="danger"
      className="bg-[#FFF5F5] border-l-4 border-red-600 border-t border-b border-r border-red-100 rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-600">
                Permanently delete your account and all data. This action is
                irreversible.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg whitespace-nowrap"
            >
              Delete Account
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-red-200">
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-900">Export Data</p>
              <p className="text-xs text-slate-600">
                Download all your data, including applications and resumes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg whitespace-nowrap"
            >
              Export
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
