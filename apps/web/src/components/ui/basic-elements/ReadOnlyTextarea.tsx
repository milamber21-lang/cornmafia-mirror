// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyTextarea.tsx
// Language: TSX
"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";

/**
 * ReadOnlyTextarea
 * - Visual sibling of Textarea but non-editable
 * - Muted text; preserves line breaks
 */
type Props = {
  value?: string | number | null | undefined;
  placeholder?: string;
  rows?: number;
  className?: string;
  "aria-label"?: string;
};

export default function ReadOnlyTextarea({
  value,
  placeholder,
  rows = 4,
  className,
  ...rest
}: Props) {
  const text =
    value === null || value === undefined || value === ""
      ? placeholder ?? "—"
      : String(value);

  return (
    <div
      role="textbox"
      aria-readonly="true"
      tabIndex={0}
      className={cn(
        "w-full rounded-[var(--radius)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] text-[var(--color-muted)]",
        "px-4 py-2 text-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        "whitespace-pre-wrap break-words",
        className
      )}
      style={{
        // Match typical textarea vertical sizing
        minHeight: `calc(${rows} * 1.5rem)`,
      }}
      {...rest}
    >
      {text}
    </div>
  );
}
