import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, Info } from "@/components/icons/ui-icons";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex w-full gap-3 rounded-lg border p-3.5 text-sm",
  {
    variants: {
      variant: {
        default: "border-line bg-surface-2 text-ink",
        error: "border-red-300 bg-red-50 text-red-900",
        warning: "border-amber-300 bg-amber-50 text-amber-900",
        info: "border-line bg-surface-2 text-ink-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant = "default", children, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
    {variant === "error" || variant === "warning" ? (
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    ) : (
      <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
    )}
    <div className="flex-1 space-y-1 leading-relaxed">{children}</div>
  </div>
));
Alert.displayName = "Alert";

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <p
      className={cn("font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[0.8125rem] leading-relaxed opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
