import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "border border-input bg-white text-gray-700 font-medium hover:bg-gray-50 rounded-lg h-10 px-4 py-2",
        primary:
          "bg-brand-primary text-white font-bold rounded-lg h-10 px-5 py-2.5 hover:bg-brand-primary-dark active:bg-[#4a37c9]",
        destructive:
          "bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 rounded-lg h-10 px-4 py-2",
        secondary:
          "bg-white text-gray-700 font-medium border border-brand-border hover:bg-gray-50 rounded-lg h-10 px-4 py-2",
        ghost:
          "font-medium hover:bg-gray-50 hover:text-foreground rounded-lg h-10 px-4 py-2",
        link: "font-medium text-foreground underline-offset-4 hover:underline h-auto px-0 py-0",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" />}
            {loading && loadingText ? loadingText : children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
