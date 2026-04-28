import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-11 w-auto",
};

const dimensionMap: Record<NonNullable<LogoProps["size"]>, { width: number; height: number }> = {
  sm: { width: 120, height: 24 },
  md: { width: 130, height: 36 },
  lg: { width: 160, height: 44 },
};

export function Logo({ variant = "default", size = "sm", className }: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="Hiretivo"
      width={dimensionMap[size].width}
      height={dimensionMap[size].height}
      className={cn(
        sizeClasses[size],
        "object-contain",
        variant === "white" && "brightness-0 invert",
        className
      )}
      priority
    />
  );
}

export function LogoLink({
  href,
  variant = "default",
  size = "sm",
  className,
}: LogoProps & { href: string }) {
  return (
    <Link href={href} className={cn("flex items-center", className)}>
      <Logo variant={variant} size={size} />
    </Link>
  );
}
