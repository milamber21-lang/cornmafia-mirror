// FILE: apps/web/src/components/ui/basic-elements/Separator.tsx
"use client";

import * as React from "react";

/**
 * Lightweight visual separator (horizontal rule) that aligns with app tokens.
 * Default: 1px hairline using --color-border. Can be vertical if `orientation="vertical"`.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export default function Separator({
  orientation = "horizontal",
  decorative = true,
  className = "",
  role,
  ...rest
}: SeparatorProps) {
  const isVertical = orientation === "vertical";
  return (
    <div
      role={decorative ? "none" : role ?? "separator"}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      className={[
        "bg-[var(--color-border)]",
        isVertical ? "w-px h-full" : "h-px w-full",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
