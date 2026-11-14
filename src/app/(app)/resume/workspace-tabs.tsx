"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { settlePendingSaves } from "@/lib/pending-saves";
import { toast } from "@/components/toast";

export function WorkspaceTabs({ active }: { active: "profile" | "resume" }) {
  const router = useRouter();
  const params = useSearchParams();
  const base = new URLSearchParams(params); base.delete("tab");
  const profile = new URLSearchParams(params); profile.set("tab", "profile");
  useEffect(() => {
    if (active !== "profile") return;
    let moving = false;
    const navigate = async (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === "/profile/import" || url.pathname === "/new" || anchor.closest('[role="dialog"]')) return;
      event.preventDefault(); event.stopPropagation();
      if (moving) return;
      moving = true;
      (document.activeElement as HTMLElement)?.blur();
      if (await settlePendingSaves()) router.push(url.pathname + url.search + url.hash);
      else toast("Your changes could not be saved. Please retry before leaving this tab.");
      moving = false;
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [active, router]);
  return <nav aria-label="Resume workspace" className="mx-10 mb-6 flex w-fit gap-1 rounded-control bg-hover p-1">
    <Link href={`/resume${base.size ? `?${base}` : ""}`} aria-current={active === "resume" ? "page" : undefined} className={`rounded-control px-4 py-2 text-sm ${active === "resume" ? "bg-card shadow-control" : ""}`}>Base resume</Link>
    <Link href={`/resume?${profile}`} aria-current={active === "profile" ? "page" : undefined} className={`rounded-control px-4 py-2 text-sm ${active === "profile" ? "bg-card shadow-control" : ""}`}>Profile</Link>
  </nav>;
}
