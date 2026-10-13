import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9.5 w-full rounded-lg border border-line-2 bg-surface px-3 py-2 text-sm text-ink transition-colors",
          "placeholder:text-ink-3",
          "hover:border-line-2/70",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:outline-red-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
