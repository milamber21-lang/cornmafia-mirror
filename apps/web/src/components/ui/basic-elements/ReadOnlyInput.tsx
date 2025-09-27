// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyInput.tsx
// Language: TSX
"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";

/**
 * ReadOnlyInput
 * - Visual sibling of Input but non-editable
 * - Muted value text for clarity
 * - Select-on-click optional
 */
type Props = {
  value?: string | number | null | undefined;
  placeholder?: string;
  /** If true, selects the content on click for easy copying */
  selectOnClick?: boolean;
  className?: string;
  "aria-label"?: string;
};

export default function ReadOnlyInput({
  value,
  placeholder,
  selectOnClick,
  className,
  ...rest
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  function handleClick() {
    if (!selectOnClick || !ref.current) return;
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  const text =
    value === null || value === undefined || value === ""
      ? placeholder ?? "—"
      : String(value);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-readonly="true"
      tabIndex={0}
      onClick={handleClick}
      className={cn(
        // Mirror input chroming
        "w-full rounded-[var(--radius)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] text-[var(--color-muted)]",
        "h-10 px-4 text-sm flex items-center",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        "select-text",
        className
      )}
      {...rest}
    >
      <span className="truncate">{text}</span>
    </div>
  );
}
