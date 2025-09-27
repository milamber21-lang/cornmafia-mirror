// FILE: apps/web/src/components/ui/basic-elements/Upload.tsx
// Language: TSX
/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { Button } from "@/components/ui";

type Props = {
  /** Called whenever user selects or drops files. Empty array means cleared. */
  onFilesSelected: (files: File[]) => void;
  /** Native accept attribute, e.g., "image/*,.png" */
  accept?: string;
  /** Allow selecting multiple files */
  multiple?: boolean;
  /** Disable all interactions */
  disabled?: boolean;
  /** Title text inside the box (left side) */
  title?: string;
  /** Helper/description text under the title */
  description?: string;
  /** Text for the action button (right side) */
  buttonText?: string;
  /** Optional aria-label for the overall region */
  ariaLabel?: string;
  /** Controlled selection coming from parent (useful with forms) */
  selected?: File | File[] | null;
  /** Show inline preview(s) below the control (images only) */
  showPreview?: boolean;
  className?: string;
};

export default function Upload({
  onFilesSelected,
  accept,
  multiple = false,
  disabled = false,
  title = "Upload file",
  description = "Drag & drop files here, or click to browse.",
  buttonText = "Choose file",
  ariaLabel = "File upload",
  selected,
  showPreview = true,
  className,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = React.useState(false);
  // Local uncontrolled selection (used when `selected` prop is not provided)
  const [localFiles, setLocalFiles] = React.useState<File[]>([]);
  // Object URLs for image previews
  const [previews, setPreviews] = React.useState<string[]>([]);

  const isControlled = selected !== undefined;
  const files: File[] = React.useMemo(() => {
    if (isControlled) {
      if (!selected) return [];
      return Array.isArray(selected) ? selected : [selected];
    }
    return localFiles;
  }, [isControlled, selected, localFiles]);

  React.useEffect(() => {
    if (!showPreview) return;
    // Revoke old URLs
    previews.forEach((url) => URL.revokeObjectURL(url));
    const next: string[] = [];
    for (const f of files) {
      if (f && typeof f.type === "string" && f.type.startsWith("image/")) {
        next.push(URL.createObjectURL(f));
      }
    }
    setPreviews(next);
    return () => {
      next.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, showPreview]);

  function pickFiles() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function applySelection(next: File[]) {
    if (!multiple && next.length > 1) next = next.slice(0, 1);
    if (!isControlled) setLocalFiles(next);
    onFilesSelected(next);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const sel = Array.from(e.currentTarget.files ?? []);
    applySelection(sel);
    // allow re-selecting the same file by clearing the input
    e.currentTarget.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;
    const sel = Array.from(e.dataTransfer?.files ?? []);
    applySelection(sel);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  const hasSelection = files.length > 0;

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          // Match Button's neutral variant shell
          "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]",
          "rounded-[var(--radius)] transition-all",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-focus)]",
          "hover:brightness-120",
          "cursor-pointer", // <-- requested pointer for whole rectangle
          disabled && "opacity-60 cursor-not-allowed",
          isDragging && "ring-2 ring-[var(--color-focus)]",
          "p-4",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (disabled) return;
          // Let clicking anywhere in the box open the file dialog (except when clicking the button which already does)
          const el = e.target as HTMLElement;
          if (el.tagName !== "BUTTON" && el.getAttribute("role") !== "button") {
            pickFiles();
          }
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: icon + texts */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "w-10 h-10 border border-[var(--color-border)]",
                "bg-[color-mix(in_oklab,var(--color-surface)_70%,var(--color-border))]"
              )}
            >
              {/* Simple upload icon (no external deps) */}
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 16V7m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="font-medium truncate">{title}</div>
              <div className="text-xs text-[var(--color-muted)] truncate">
                {hasSelection
                  ? multiple
                    ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                    : files[0]?.name || description
                  : description}
              </div>
            </div>
          </div>

          {/* Right: button mirrors Button neutral variant */}
          <div className="shrink-0">
            <Button
              type="button"
              size="md"
              variant="neutral"
              onClick={pickFiles}
              disabled={disabled}
            >
              {buttonText}
            </Button>
          </div>
        </div>

        {/* Hidden native input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
        />
      </div>

      {/* Preview area (names + image thumbnails) */}
      {hasSelection && (
        <div className="space-y-2">
          {/* File names */}
          <ul className="text-xs text-[var(--color-muted)]">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="break-all">
                {f.name}{" "}
                <span className="opacity-70">
                  ({(f.size / 1024).toFixed(1)} KB{f.type ? `, ${f.type}` : ""})
                </span>
              </li>
            ))}
          </ul>

          {/* Image previews */}
          {showPreview && previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="border border-[var(--color-border)] rounded-md overflow-hidden"
                  style={{ width: 140 }}
                >
                  <img
                    src={src}
                    alt={files[i]?.name || `preview-${i}`}
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
