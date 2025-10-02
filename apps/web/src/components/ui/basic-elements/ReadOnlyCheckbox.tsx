// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyCheckbox.tsx
"use client";

import { cn } from "../../../lib/cn";
import { ComponentProps } from "react";

/**
 * ReadOnlyCheckbox
 * - Visual twin of Checkbox's *neutral* wrapper
 * - Native indicator stays (more recognizable)
 * - Non-interactive: disabled, aria-readonly, no pointer/hover
 */
type Size = "sm" | "md" | "lg";

function sizeCls(size: Size) {
  if (size === "sm") return "h-8 px-3 text-sm";
  if (size === "lg") return "h-12 px-5 text-base";
  return "h-10 px-4 text-sm";
}

function boxSize(size: Size) {
  if (size === "sm") return "w-4 h-4";
  if (size === "lg") return "w-6 h-6";
  return "w-5 h-5";
}

export default function ReadOnlyCheckbox({
  checked,
  label,
  size = "md",
  className,
  ...rest
}: {
  checked?: boolean;
  label?: string;
  size?: Size;
} & Omit<ComponentProps<"input">, "type" | "size" | "checked" | "onChange">) {
  return (
    <label
      className={cn(
        // neutral wrapper (mirror of Button neutral)
        "inline-flex items-center justify-start gap-2 select-none transition-all",
        "rounded-[var(--radius)]",
        "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]",
        // focus ring for accessibility even when read-only
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-focus)]",
        // read-only look (no hover, no pointer)
        "cursor-default",
        sizeCls(size),
        className
      )}
      aria-readonly="true"
    >
      <input
        {...rest}
        type="checkbox"
        checked={!!checked}
        readOnly
        disabled
        className={cn(boxSize(size))}
        // keep native indicator; align accent with theme but muted
        style={{ accentColor: "var(--color-focus)" }}
        tabIndex={-1}
      />
      {label ? (
        <span className="select-none text-[color-mix(in_oklab,var(--color-text)_70%,transparent)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
