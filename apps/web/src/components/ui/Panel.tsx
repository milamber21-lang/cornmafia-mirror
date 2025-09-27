// FILE: apps/web/src/components/ui/Panel.tsx
"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Button, Separator } from "@/components/ui";

type WidthPreset = "25%" | "50%" | "75%" | "100%";

export interface PanelProps {
  open: boolean;
  onClose: () => void;

  /** Sheet width (presets). Default "50%". */
  width?: WidthPreset;

  /** When true, clicking the backdrop will close (default true). */
  backdropClosable?: boolean;

  /** Disable interactions and close while busy. */
  loading?: boolean;

  /** Center Save button visibility (if provided). */
  showSave?: boolean;

  /** Header title (left). */
  title: React.ReactNode;

  /** Render a Save button in the center (you control its click + disabled state). */
  renderSave?: () => React.ReactNode;

  /** Right-side header content (default Close button). */
  renderRight?: () => React.ReactNode;

  /** Panel content (below the header + separator). */
  children?: React.ReactNode;

  /** If true, prevent close and ask for confirmation when attempting to close. */
  dirtyGuard?: boolean;

  /** Optional aria-label/id wiring */
  labelledById?: string;
}

/**
 * Slide-in sheet from the right with a sticky header:
 * Title (left) | Save (center) | Close (right)
 * Includes ESC/backdrop close (respecting loading + dirty guard).
 */
export default function Panel({
  open,
  onClose,
  width = "50%",
  backdropClosable = true,
  loading = false,
  showSave = true,
  title,
  renderSave,
  renderRight,
  children,
  dirtyGuard = false,
  labelledById,
}: PanelProps) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Remember previously focused element to restore on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
      // Move focus to panel container on open (basic focus management).
      setTimeout(() => {
        const el = document.getElementById("__panel_root");
        el?.focus();
      }, 0);
    } else {
      // Restore focus when closing.
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        attemptClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, dirtyGuard]);

  function attemptClose() {
    if (loading) return;
    if (dirtyGuard) {
      // Native confirm to avoid bringing in new UI; can be replaced by a custom Confirm later.
      const ok = window.confirm("You have unsaved changes. Discard them and close?");
      if (!ok) return;
    }
    onClose();
  }

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          if (!open) return;
          if (!backdropClosable) return;
          attemptClose();
        }}
      />

      {/* Panel */}
      <div
        id="__panel_root"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        className={[
          "absolute right-0 top-0 h-full bg-neutral-950 shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{ width }}
        onClick={(e) => {
          // Prevent backdrop close on inner clicks.
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-neutral-950">
          <div className="grid grid-cols-3 items-center p-4">
            <div className="min-w-0">
              <h2 id={labelledById} className="text-lg font-semibold truncate">
                {title}
              </h2>
            </div>

            <div className="flex justify-center">
              {showSave && typeof renderSave === "function" ? renderSave() : null}
            </div>

            <div className="flex justify-end">
              {typeof renderRight === "function" ? (
                renderRight()
              ) : (
                <Button
                  variant="neutral"
                  onClick={attemptClose}
                  disabled={loading}
                  aria-label="Close panel"
                >
                  Close
                </Button>
              )}
            </div>
          </div>

          <Separator />
        </div>

        {/* Body */}
        <div className="p-4 h-[calc(100%-var(--header-height,64px))] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
