"use client";

import { Plus } from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";

/*
 * AddYourOwnLinkCard
 * First card in Browse grid — pastel mint, mirrors Image 1 Tsenta.
 * Click opens AddCustomJobModal (ATS URL + paste description).
 */
export function AddYourOwnLinkCard({ className }: { className?: string }) {
  const openAddCustomJobModal = useUIStore((s) => s.openAddCustomJobModal);

  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-150 h-[260px] ${className ?? "w-full"}`}
      style={{ backgroundColor: "#E6FFF4" }}
      onClick={openAddCustomJobModal}
      role="button"
      aria-label="Add your own link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAddCustomJobModal(); } }}
    >
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-foreground">Workday, Greenhouse</p>
            <p className="text-xs text-brand-foreground-muted">etc.</p>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#C8EDE0] flex items-center justify-center">
            <Plus className="h-5 w-5 text-[#0a5a3a]" />
          </div>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-brand-foreground line-clamp-2 min-h-[44px]">Add Your Own Link</h3>

        <p className="text-xs text-brand-foreground-muted">Paste a URL and optional job description</p>
        {/* <p className="text-[11px] text-brand-foreground-muted line-clamp-2">Add any ATS link or paste description directly — quick apply supports all major boards.</p> */}
      </div>

      <div className="bg-white flex items-center justify-between px-3 py-2.5 border-t border-gray-200">
        <div className="min-w-0">
          <p className="text-xs font-bold text-brand-foreground">Quick Apply</p>
          <p className="text-[11px] text-brand-foreground-muted">Any supported job board</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openAddCustomJobModal(); }}
          className="inline-flex items-center gap-1 rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
