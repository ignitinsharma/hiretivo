"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/*
 * HeroSearch
 * Renders the public homepage search box and sends visitors to seeker login.
 * Returns a mobile-first stacked input/button form.
 */
export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchClick = () => {
    const query = searchQuery.trim();
    if (query) {
      router.push(
        `/seeker/login?redirect=${encodeURIComponent(`/jobs?q=${encodeURIComponent(query)}`)}`,
      );
    } else {
      router.push("/seeker/login");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border border-brand-border bg-white p-2 sm:flex-row sm:items-center sm:rounded-lg">
      <div className="flex min-w-0 grow items-center py-2 sm:py-0">
        <span className="material-symbols-outlined mx-3 shrink-0 text-brand-foreground-secondary">
          search
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 w-full border-none pr-2 font-medium text-brand-foreground placeholder:text-brand-foreground-secondary focus:outline-none focus:ring-0"
          placeholder="Job title, keywords, or company..."
          type="text"
        />
      </div>
      <Button
        variant="primary"
        size="lg"
        className="w-full sm:w-auto"
        onClick={handleSearchClick}
      >
        Search Jobs
      </Button>
    </div>
  );
}
