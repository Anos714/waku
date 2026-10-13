import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[colors,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-bg hover:bg-ink/90 shadow-card-sm",
        accent:
          "bg-accent text-accent-ink hover:bg-accent-2 shadow-card-sm",
        outline:
          "border border-line-2 bg-transparent text-ink hover:bg-surface-2 hover:border-ink/30",
        ghost: "text-ink hover:bg-surface-2",
        quiet: "text-ink-2 hover:text-ink hover:bg-surface-2",
        danger:
          "border border-transparent bg-transparent text-red-600 hover:bg-red-600/10",
        surface: "bg-surface text-ink border border-line hover:border-line-2 shadow-card-sm",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem] rounded-lg",
        md: "h-9.5 px-4 text-sm rounded-lg",
        lg: "h-11 px-5 text-sm rounded-lg",
        xl: "h-12 px-6 text-base rounded-lg",
        icon: "h-9 w-9 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
