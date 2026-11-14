import { cn } from "@/lib/cn";

/** Decorative loading indicator; pair it with visible text or an existing status announcement. */
export function Spinner({ size = "sm", className }: { size?: "xs" | "sm" | "md"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-spinner=""
      className={cn(
        "inline-block shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin",
        size === "xs" ? "size-3" : size === "sm" ? "size-4" : "size-[18px]",
        className,
      )}
    />
  );
}
