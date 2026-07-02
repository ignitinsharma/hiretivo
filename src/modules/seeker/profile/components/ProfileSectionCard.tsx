import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ProfileSectionCardProps {
  title: string;
  editHref: string;
  children: ReactNode;
  isEmpty: boolean;
  emptyLabel: string;
}

/*
 * ProfileSectionCard
 * Shared read-view card shell: title + "Edit" link into settings, renders
 * children or an empty-state label. Reused by every profile section card.
 */
export function ProfileSectionCard({
  title,
  editHref,
  children,
  isEmpty,
  emptyLabel,
}: ProfileSectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-brand-border p-6">
        <h3 className="text-lg font-bold text-brand-foreground">{title}</h3>
        <Button variant="ghost" size="sm" asChild>
          <a href={editHref}>Edit</a>
        </Button>
      </div>
      <div className="p-6">
        {isEmpty ? (
          <p className="text-sm text-brand-foreground-muted">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
