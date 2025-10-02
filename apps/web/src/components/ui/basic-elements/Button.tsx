// FILE: apps/web/src/components/ui/basic-elements/Button.tsx
"use client";

import Link from "next/link";
import { cn } from "../../../lib/cn";
import { ComponentProps, ReactNode } from "react";

type Size = "sm" | "md" | "lg";
/** Added "green" to variants per project request */
type Variant = "neutral" | "accent" | "ghost" | "green";

type BaseProps = {
  size?: Size;
  variant?: Variant;
  pill?: boolean;
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
};

function sizeCls(size: Size) {
  if (size === "sm") return "h-8 px-3 text-sm";
  if (size === "lg") return "h-12 px-5 text-base";
  return "h-10 px-4 text-sm";
}

/** Mirrors your original variant mapping; adds "green" using --color-green. */
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

const baseCls =
  "inline-flex items-center justify-center whitespace-nowrap select-none transition-all " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] " +
  "disabled:opacity-60 disabled:cursor-not-allowed rounded-[var(--radius)] cursor-pointer";

export function Button({
  size = "md",
  variant = "neutral",
  pill,
  block,
  leftIcon,
  rightIcon,
  loading,
  className,
  children,
  ...rest
}: BaseProps & Omit<ComponentProps<"button">, "color">) {
  return (
    <button
      className={cn(
        baseCls,
        sizeCls(size),
        variantCls(variant),
        pill && "rounded-full",
        block && "w-full",
        className
      )}
      {...rest}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {loading ? "Loading…" : children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

export function ButtonLink({
  size = "md",
  variant = "neutral",
  pill,
  block,
  leftIcon,
  rightIcon,
  loading,
  href,
  className,
  children,
  ...rest
}: BaseProps &
  Omit<ComponentProps<typeof Link>, "href" | "className"> & { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        // Mark as a UI button-link so global.css content link rules skip it.
        "ui-btn no-underline",
        baseCls,
        sizeCls(size),
        variantCls(variant),
        pill && "rounded-full",
        block && "w-full",
        className
      )}
      {...rest}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {loading ? "Loading…" : children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Link>
  );
}
