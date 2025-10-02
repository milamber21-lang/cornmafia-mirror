// FILE: apps/web/src/components/ui/basic-elements/Checkbox.tsx
// Language: TSX
"use client";

import { cn } from "../../../lib/cn";
import { InputHTMLAttributes } from "react";

/**
 * Checkbox
 * - Matches Button's public API where it makes sense (size, variant, pill, block)
 * - Keeps the *native* checkbox indicator (no custom glyph) for better familiarity
 * - Uses CSS `accent-color` to harmonize with theme/variant, without replacing the native look
 */

type Size = "sm" | "md" | "lg";
type Variant = "neutral" | "accent" | "ghost" | "green";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: Size;
  variant?: Variant;
  label?: string;
  block?: boolean;
  pill?: boolean;
};

function sizeCls(size: Size) {
  // Keep wrapper sizing in sync with Button
  if (size === "sm") return "h-8 px-3 text-sm";
  if (size === "lg") return "h-12 px-5 text-base";
  return "h-10 px-4 text-sm";
}

/** Mirrors Button variants for the *wrapper* surface */
function variantCls(variant: Variant) {
  if (variant === "accent") {
    return [
      "bg-[var(--color-accent)]",
      "border",
      "border-[color-mix(in_oklab,var(--color-accent)_70%,var(--color-border))]",
      "text-[var(--color-text)]",
      "hover:brightness-120",
    ].join(" ");
  }
  if (variant === "green") {
    return [
      "bg-[var(--color-green)]",
      "border",
      "border-[color-mix(in_oklab,var(--color-green)_70%,var(--color-border))]",
      "text-[var(--color-text)]",
      "hover:brightness-120",
    ].join(" ");
  }
  if (variant === "ghost") {
    return [
      "bg-transparent",
      "border",
      "border-transparent",
      "text-[var(--color-text)]",
      "hover:bg-[var(--color-surface)]",
      "hover:border-[var(--color-border)]",
    ].join(" ");
  }
  // neutral
  return [
    "bg-[var(--color-surface)]",
    "border",
    "border-[var(--color-border)]",
    "text-[var(--color-text)]",
    "hover:brightness-120",
  ].join(" ");
}

const baseSurface =
  "inline-flex items-center justify-start gap-2 select-none transition-all " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] " +
  "disabled:opacity-60 disabled:cursor-not-allowed rounded-[var(--radius)] cursor-pointer";

/** Native checkbox box sizing so it feels balanced inside wrapper heights */
function boxSize(size: Size) {
  if (size === "sm") return "w-4 h-4";
  if (size === "lg") return "w-6 h-6";
  return "w-5 h-5";
}

/** Accent color applied to the native indicator */
function accentColorFor(variant: Variant): string {
  if (variant === "accent") return "var(--color-accent)";
  if (variant === "green") return "var(--color-green)";
  // For neutral/ghost, using focus/brand accent improves visibility
  return "var(--color-focus)";
}

export default function Checkbox({
  size = "md",
  variant = "neutral",
  label,
  className,
  block,
  pill,
  id,
  ...rest
}: Props) {
  const inputBox = boxSize(size);
  const accent = accentColorFor(variant);

  return (
    <label
      htmlFor={id}
      className={cn(
        baseSurface,
        sizeCls(size),
        variantCls(variant),
        pill && "rounded-full",
        block && "w-full",
        className
      )}
    >
      {/* Keep the native checkbox visible for familiar indicator behavior */}
      <input
        id={id}
        {...rest}
        type="checkbox"
        className={cn(inputBox)}
        // Harmonize with theme without replacing the native look:
        // supported in all modern browsers
        style={{ accentColor: accent }}
      />
      {label ? <span className="select-none">{label}</span> : null}
    </label>
  );
}
