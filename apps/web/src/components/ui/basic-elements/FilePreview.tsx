// FILE: apps/web/src/components/ui/basic-elements/FilePreview.tsx
// Language: TSX
"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "../../../lib/cn";

type Props = {
  /** A File chosen locally (e.g., from Upload) */
  file?: File | null;
  /** Remote or local URL (e.g., CDN link). If `file` is provided, that takes precedence. */
  src?: string | null;
  /** Optional metadata shown under the thumbnail/tile */
  filename?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  /** Alt text for images */
  alt?: string;
  /** Force “treat as image” or “treat as file”; if omitted, we infer from mimeType or file.type */
  kind?: "image" | "file";
  /** Size of the preview box (CSS width in px). Height auto for images; fixed for file tile. */
  width?: number; // default 320
  /** Rounded corners + bordered tile to match UI look */
  rounded?: boolean;
  bordered?: boolean;
  /** Show metadata (filename / size / mime) under the preview */
  showMeta?: boolean;
  /** Optional href to allow download/open on click (applies to the preview area) */
  href?: string | null;
  /** Open link in new tab */
  targetBlank?: boolean;
  className?: string;
};

function formatBytes(n?: number | null) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let u = 0;
  while (x >= 1024 && u < units.length - 1) {
    x /= 1024;
    u++;
  }
  return `${x.toFixed(1)} ${units[u]}`;
}

function extFromName(name?: string | null) {
  if (!name) return "";
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "";
}

export default function FilePreview({
  file,
  src,
  filename,
  mimeType,
  sizeBytes,
  alt = "",
  kind,
  width = 320,
  rounded = true,
  bordered = true,
  showMeta = true,
  href,
  targetBlank,
  className,
}: Props) {
  // Prefer object URL from File
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const url = objectUrl || src || null;

  const mime = file?.type || mimeType || "";
  const isImage = (() => {
    if (kind === "image") return true;
    if (kind === "file") return false;
    if (mime) return mime.startsWith("image/");
    // Fallback heuristic for URLs without mime
    if (url) {
      const lower = url.toLowerCase();
      return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower);
    }
    // As a last resort: extension from filename
    const ext = (filename || "").toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(ext);
  })();

  const tileCls = cn(
    bordered && "border border-[var(--color-border)]",
    rounded && "rounded-md",
    "overflow-hidden bg-[var(--color-surface)]"
  );

  const content =
    isImage && url ? (
      // Image preview (Next/Image)
      <div className={cn(tileCls)} style={{ width }}>
        <div className="relative" style={{ width, height: Math.round((width * 9) / 16) || 180 }}>
          <Image
            src={url}
            alt={alt || filename || "preview"}
            fill
            sizes={`${width}px`}
            style={{ objectFit: "contain" }}
            // If your next.config doesn't allow the remote domain, add it there.
            // Using fill keeps aspect without layout shift.
          />
        </div>
      </div>
    ) : (
      // Generic file tile with extension badge
      <div className={cn(tileCls, "flex items-center justify-center")} style={{ width, height: 180 }}>
        <div className="text-center px-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md border border-[var(--color-border)] mb-2">
            {/* Simple document icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            {extFromName(filename) || (mime ? mime.split("/")[1]?.toUpperCase() : "FILE")}
          </div>
        </div>
      </div>
    );

  const body = href ? (
    <a
      href={href}
      target={targetBlank ? "_blank" : undefined}
      rel={targetBlank ? "noreferrer noopener" : undefined}
      className="block hover:brightness-110 transition"
    >
      {content}
    </a>
  ) : (
    content
  );

  return (
    <div className={cn("inline-flex flex-col gap-2", className)} style={{ width }}>
      {body}
      {showMeta && (
        <div className="text-xs text-[var(--color-muted)] break-all">
          {filename ? <div className="truncate" title={filename}>{filename}</div> : null}
          <div className="opacity-80">
            {[formatBytes(sizeBytes ?? file?.size ?? null), mime || (file?.type ?? "")]
              .filter(Boolean)
              .join(" \u2014 ")}
          </div>
        </div>
      )}
    </div>
  );
}
