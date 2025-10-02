// FILE: apps/web/src/components/ui/basic-elements/DropdownMenuSingle.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export type SingleOption = { value: string; label: string; disabled?: boolean };

type Props = {
  options: SingleOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

export default function DropdownMenuSingle({
  options,
  value,
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

  const selected = options.find((o) => o.value === value);

  const sz =
    size === "sm" ? "h-8 px-3 text-sm" : size === "lg" ? "h-12 px-4 text-base" : "h-10 px-4 text-sm";

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
        <span className={cn(!selected && "opacity-70")}>{selected?.label ?? placeholder}</span>
        <span aria-hidden className="opacity-70">▾</span>
      </button>

      {open && (
        <div
          ref={popRef}
          role="listbox"
          id={uid}
          className={cn(
            "absolute z-[20] mt-1 w-full overflow-auto max-h-72",
            "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-1)]"
          )}
        >
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={active}
                disabled={opt.disabled}
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2",
                  active ? "bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)]" : "hover:bg-[var(--color-bg)]/60",
                  opt.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
