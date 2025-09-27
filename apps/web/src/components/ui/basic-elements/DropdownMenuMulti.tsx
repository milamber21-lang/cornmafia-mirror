// FILE: apps/web/src/components/ui/basic-elements/DropdownMenuMulti.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export type MultiOption = { value: string; label: string; disabled?: boolean };

type Props = {
  options: MultiOption[];
  value?: string[]; // selected values
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

export default function DropdownMenuMulti({
  options,
  value = [],
  onChange,
  placeholder = "Select…",
  disabled,
  size = "md",
  className,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const sz =
    size === "sm" ? "h-8 px-3 text-sm" : size === "lg" ? "h-12 px-4 text-base" : "h-10 px-4 text-sm";

  const label =
    value.length === 0
      ? placeholder
      : options
          .filter((o) => value.includes(o.value))
          .map((o) => o.label)
          .join(", ");

  function toggle(v: string) {
    const set = new Set(value);
    if (set.has(v)) set.delete(v);
    else set.add(v);
    onChange?.(Array.from(set));
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={uid}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]",
          "text-[var(--color-text)] text-left",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
          "inline-flex items-center justify-between gap-2",
          sz
        )}
      >
        <span className={cn(value.length === 0 && "opacity-70")}>{label}</span>
        <span aria-hidden className="opacity-70">▾</span>
      </button>

      {open && (
        <div
          ref={popRef}
          role="listbox"
          aria-multiselectable
          id={uid}
          className={cn(
            "absolute z-[20] mt-1 w-full overflow-auto max-h-72",
            "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-1)]"
          )}
        >
          {options.map((opt) => {
            const active = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer",
                  active ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)]" : "hover:bg-[var(--color-bg)]/60",
                  opt.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  disabled={opt.disabled}
                  onChange={() => toggle(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
