"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/*
 * Pagination
 * Renders prev/next chevrons and numbered page buttons with ellipsis for large page counts.
 * Renders nothing if totalPages <= 1.
 * @param currentPage - 1-indexed current page number
 * @param totalPages  - total page count computed from total/limit
 * @param onPageChange - callback fired with the new page number
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-brand-foreground-muted disabled:opacity-30"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-7 h-7 flex items-center justify-center text-brand-foreground-muted text-[11px]"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            size="icon"
            className={cn(
              "h-7 w-7 text-[11px] font-bold",
              p === currentPage
                ? "bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-dk"
                : "bg-white text-brand-foreground border border-brand-border hover:bg-brand-surface",
            )}
            variant={p === currentPage ? "default" : "secondary"}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-brand-foreground-muted disabled:opacity-30"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
