// FILE: apps/web/src/components/ui/basic-elements/FilePreviewList.tsx
// Language: TSX
"use client";

import * as React from "react";
import FilePreview from "./FilePreview";
import { cn } from "../../../lib/cn";

type Item =
  | {
      file: File;
      href?: string | null;
    }
  | {
      src: string;
      filename?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
      href?: string | null;
    };

type Props = {
  items: Item[];
  width?: number; // each tile width
  className?: string;
};

export default function FilePreviewList({ items, width = 200, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {items.map((it, i) => {
        if ("file" in it) {
          return <FilePreview key={i} file={it.file} width={width} href={it.href ?? null} />;
        }
        return (
          <FilePreview
            key={i}
            src={it.src}
            filename={it.filename}
            mimeType={it.mimeType}
            sizeBytes={it.sizeBytes ?? null}
            width={width}
            href={it.href ?? null}
          />
        );
      })}
    </div>
  );
}
