import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-2 ring-1 ring-inset ring-line",
        className,
      )}
      aria-hidden="true"
    />
  );
}
