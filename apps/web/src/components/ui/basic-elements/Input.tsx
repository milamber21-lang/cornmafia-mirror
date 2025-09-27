// FILE: apps/web/src/components/ui/basic-elements/Input.tsx
"use client";

import { cn } from "../../../lib/cn";
import { InputHTMLAttributes } from "react";

type UISize = "sm" | "md" | "lg";

// Note: HTML <input> already has a native `size` attribute (number).
// We Omit it from the base props and reuse the `size` name for our UI sizing.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: UISize;
};

export default function Input({ className, size = "md", ...rest }: Props) {
  const sz =
    size === "sm" ? "h-8 px-3 text-sm" : size === "lg" ? "h-12 px-4 text-base" : "h-10 px-4 text-sm";

  return (
    <input
      {...rest}
      className={cn(
        "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        "text-[var(--color-text)] placeholder-[color-mix(in_oklab,var(--color-text)_50%,transparent)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        sz,
        className
      )}
    />
  );
}
