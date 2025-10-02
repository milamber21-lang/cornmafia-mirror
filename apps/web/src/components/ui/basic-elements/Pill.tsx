// FILE: apps/web/src/components/ui/basic-elements/Pill.tsx
"use client";

import * as React from "react";
import { ReactNode } from "react";
import { cn } from "../../../lib/cn";

/**
 * Named semantic colors resolved to your theme tokens.
 * These are only used by <Pill>. <PillSwatch> ignores names and uses rawColor directly.
 */
const NAMED: Record<string, string> = {
  green: "var(--color-green)",
  accent: "var(--color-accent)",
  warning: "var(--color-warning, #b58900)",
  danger: "var(--color-danger, #b00020)",
  neutral: "var(--color-border)",
};

/** Normalize raw color strings for CSS usage. */
function normalizeColor(input?: string | null): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  if (v.startsWith("--")) return `var(${v})`;
  return v;
}

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "solid" | "soft" | "outline";

/** Dimensions */
const sizeMap: Record<Size, string> = {
  xs: "h-[16px] px-[6px] text-[10px] gap-[6px] rounded-full",
  sm: "h-[20px] px-[8px] text-[11px] gap-[6px] rounded-full",
  md: "h-[24px] px-[10px] text-[12px] gap-[8px] rounded-full",
  lg: "h-[28px] px-[12px] text-[13px] gap-[8px] rounded-full",
};

function variantClasses(variant: Variant): string {
  if (variant === "outline") {
    return ["bg-transparent", "border", "text-[var(--color-text)]"].join(" ");
  }
  if (variant === "soft") {
    return ["border", "text-[var(--color-text)]"].join(" ");
  }
  // solid
  return ["border", "text-[var(--color-text)]"].join(" ");
}

export type PillProps = {
  children?: ReactNode;
  size?: Size;
  variant?: Variant;
  /** CSS color string or a named key from NAMED. */
  color?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  ariaPressed?: boolean;
  disabled?: boolean;
};

export function Pill({
  children,
  size = "sm",
  variant = "soft",
  color,
  leftIcon,
  rightIcon,
  className,
  title,
  onClick,
  role,
  tabIndex,
  ariaPressed,
  disabled,
}: PillProps) {
  const resolvedRaw = color && NAMED[color] ? NAMED[color] : color;
  const resolved = normalizeColor(resolvedRaw);

  // Inline styles based on variant + color
  let style: React.CSSProperties = {};
  if (variant === "outline") {
    style = {
      background: "transparent",
      borderColor: resolved ?? "var(--color-border)",
    };
  } else if (variant === "soft") {
    const c = resolved ?? "var(--color-surface)";
    style = {
      background: `color-mix(in oklab, ${c} 20%, transparent)`,
      borderColor: `color-mix(in oklab, ${c} 50%, var(--color-border))`,
    };
  } else {
    // solid
    const c = resolved ?? "var(--color-surface)";
    style = {
      background: c,
      borderColor: `color-mix(in oklab, ${c} 70%, var(--color-border))`,
    };
  }

  return (
    <span
      className={cn(
        "inline-flex select-none items-center",
        "border transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizeMap[size],
        variantClasses(variant),
        onClick && "cursor-pointer",
        className
      )}
      style={style}
      title={title}
      onClick={disabled ? undefined : onClick}
      role={role}
      tabIndex={tabIndex}
      aria-pressed={ariaPressed}
    >
      {leftIcon && <span className="shrink-0 mr-1">{leftIcon}</span>}
      {children && <span className="truncate">{children}</span>}
      {rightIcon && <span className="shrink-0 ml-1">{rightIcon}</span>}
    </span>
  );
}

/**
 * PillSwatch — color-only pill for representing arbitrary colors from data.
 */
export type PillSwatchProps = {
  rawColor?: string | null;
  size?: Size;
  className?: string;
  title?: string;
};

const swatchSizeMap: Record<Size, string> = {
  xs: "h-[10px] w-[20px] rounded-full",
  sm: "h-[14px] w-[28px] rounded-full",
  md: "h-[18px] w-[36px] rounded-full",
  lg: "h-[22px] w-[44px] rounded-full",
};

export function PillSwatch({ rawColor, size = "sm", className, title }: PillSwatchProps) {
  const normalized = normalizeColor(rawColor);
  const hasColor = !!normalized && (normalized.startsWith("#") || normalized.startsWith("var("));
  const bg = hasColor ? normalized! : "transparent";
  const br = hasColor
    ? `color-mix(in oklab, ${normalized} 70%, var(--color-border))`
    : "var(--color-border)";

  return (
    <span
      className={cn("inline-block border", swatchSizeMap[size], className)}
      style={{ background: bg, borderColor: br }}
      title={title ?? (hasColor ? normalized! : "undefined")}
      aria-label={hasColor ? normalized! : "undefined"}
    />
  );
}
