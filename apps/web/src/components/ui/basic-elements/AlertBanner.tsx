// FILE: apps/web/src/components/ui/basic-elements/AlertBanner.tsx
// Language: TSX
"use client";

import { useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

type Props = {
  tone?: "warning" | "error" | "info" | "success";
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
  /** Auto-hide after this many milliseconds. Defaults to 5000. Set to 0 to disable. */
  autoHideMs?: number;
};

export default function AlertBanner({
  tone = "warning",
  children,
  dismissible,
  className,
  autoHideMs = 5000,
}: Props) {
  const [open, setOpen] = useState(true);

  // Auto-hide after ~5s by default (can be disabled with autoHideMs={0})
  useEffect(() => {
    if (!open) return;
    if (typeof autoHideMs !== "number" || autoHideMs <= 0) return;
    const t: ReturnType<typeof setTimeout> = setTimeout(() => setOpen(false), autoHideMs);
    return () => clearTimeout(t);
  }, [open, autoHideMs]);

  if (!open) return null;

  const toneBg =
    tone === "info"
      ? "bg-[var(--color-surface)]"
      : tone === "success"
      ? "bg-[color-mix(in_oklab,var(--color-text)_10%,transparent)]"
      : tone === "error"
      ? "bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)]"
      : "bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)]"; // warning

  const toneBr =
    tone === "info"
      ? "border-[var(--color-border)]"
      : tone === "success"
      ? "border-[color-mix(in_oklab,var(--color-text)_20%,transparent)]"
      : "border-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))]";

  return (
    <div
      role="status"
      className={cn(
        "w-full border-b px-4 py-2",
        "sticky top-0 z-[11]",
        toneBg,
        toneBr,
        className
      )}
    >
      <div className="container" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            className={cn(
              "inline-flex items-center justify-center h-8 px-2 rounded-[var(--radius)]",
              "bg-[var(--color-surface)] border border-[var(--color-border)]",
              "text-[var(--color-text)] hover:brightness-105",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            )}
            onClick={() => setOpen(false)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
