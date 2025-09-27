// FILE: apps/web/src/components/ui/basic-elements/Badge.tsx
import { cn } from "../../../lib/cn";
import { HTMLAttributes } from "react";

type Variant = "neutral" | "accent" | "outline";

export default function Badge({
  variant = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const cls =
    variant === "accent"
      ? "bg-[var(--color-accent)] text-[var(--color-text)] border border-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-border))]"
      : variant === "outline"
      ? "bg-transparent text-[var(--color-text)] border border-[var(--color-border)]"
      : "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]";
  return (
    <span
      {...rest}
      className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full", cls, className)}
    />
  );
}
