import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  className?: string;
  children: React.ReactNode;
}

export function BrowserFrame({ className, children }: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-brand-border bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-brand-border bg-white px-4 py-2.5">
        <span className="flex shrink-0 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </span>
        <span className="h-1.5 w-28 rounded-full bg-brand-surface" />
      </div>
      {children}
    </div>
  );
}
