"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2 sm:flex-row sm:items-center sm:rounded-lg">
      <div className="flex min-w-0 grow items-center py-2 sm:py-0">
        <span className="material-symbols-outlined text-gray-400 mx-3">
          search
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-2 w-full border-none focus:ring-0 text-foreground font-medium placeholder-gray-400 focus:outline-none"
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
