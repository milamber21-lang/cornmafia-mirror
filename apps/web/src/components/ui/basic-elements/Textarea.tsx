// FILE: apps/web/src/components/ui/basic-elements/Textarea.tsx
"use client";

import { cn } from "../../../lib/cn";
import { TextareaHTMLAttributes } from "react";

type UISize = "sm" | "md" | "lg";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  uiSize?: UISize;
};

export default function Textarea({ className, uiSize = "md", rows = 5, ...rest }: Props) {
  const pad = uiSize === "sm" ? "px-3 py-2 text-sm" : uiSize === "lg" ? "px-4 py-3 text-base" : "px-4 py-2.5 text-sm";
  return (
    <textarea
      {...rest}
      rows={rows}
      className={cn(
        "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        "text-[var(--color-text)] placeholder-[color-mix(in_oklab,var(--color-text)_50%,transparent)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        "resize-vertical",
        pad,
        className
      )}
    />
  );
}
