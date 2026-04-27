import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="font-black text-[40px] leading-[0.85] text-brand-heading [font-feature-settings:'calt']">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 font-semibold text-[18px] leading-[1.44] tracking-[-0.108px] text-brand-muted-secondary [font-feature-settings:'calt']">
          {subtitle}
        </p>
      )}
    </div>
  );
}
