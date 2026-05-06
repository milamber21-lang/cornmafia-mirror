//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Pill.tsx                                                      ////
//// Language: TSX                                                                                                 ////
//// Shared pill and pill-swatch primitives for small semantic badges                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { isNoTintIconColor } from "@/lib/helpers/icon-color";

const NAMED: Record<string, string> = {
	green: "var(--theme-green)",
	accent: "var(--theme-accent)",
	warning: "var(--theme-warning)",
	danger: "var(--theme-danger)",
	neutral: "var(--theme-border)",
};

function normalizeColor(input?: string | null): string | null {
	if (!input) {
		return null;
	}

	const value = input.trim();
	if (!value) {
		return null;
	}

	if (value.startsWith("--")) {
		return `var(${value})`;
	}

	return value;
}

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "solid" | "soft" | "outline";

type PillStyle = React.CSSProperties & {
	"--ui-pill-color"?: string;
};

type PillSwatchStyle = React.CSSProperties & {
	"--ui-pill-swatch-bg"?: string;
	"--ui-pill-swatch-border"?: string;
};

export type PillProps = {
	children?: React.ReactNode;
	size?: Size;
	variant?: Variant;
	color?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
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
}: PillProps): React.JSX.Element {
	const resolvedRaw = color && NAMED[color] ? NAMED[color] : color;
	const resolved = normalizeColor(resolvedRaw);
	const style: PillStyle = resolved ? { "--ui-pill-color": resolved } : {};

	return (
		<span
			className={cn(
				"ui-pill",
				`ui-pill--${size}`,
				`ui-pill--${variant}`,
				onClick && "ui-pill--clickable",
				className,
			)}
			style={style}
			title={title}
			onClick={disabled ? undefined : onClick}
			role={role}
			tabIndex={tabIndex}
			aria-pressed={ariaPressed}
			aria-disabled={disabled || undefined}
		>
			{leftIcon && <span className="ui-pill__icon ui-pill__icon--left">{leftIcon}</span>}
			{children && <span className="ui-pill__label">{children}</span>}
			{rightIcon && <span className="ui-pill__icon ui-pill__icon--right">{rightIcon}</span>}
		</span>
	);
}

export type PillSwatchProps = {
	rawColor?: string | null;
	size?: Size;
	className?: string;
	title?: string;
};

export function PillSwatch({
	rawColor,
	size = "sm",
	className,
	title,
}: PillSwatchProps): React.JSX.Element {
	const noTint = isNoTintIconColor(rawColor);
	const normalized = normalizeColor(rawColor);
	const hasColor =
		!!normalized &&
		!noTint &&
		(normalized.startsWith("#") || normalized.startsWith("var("));
	const background = hasColor ? normalized : undefined;
	const label = noTint ? "Original / no tint" : hasColor ? normalized : "undefined";
	const style: PillSwatchStyle = background
		? {
				"--ui-pill-swatch-bg": background,
			}
		: {};

	return (
		<span
			className={cn(
				"ui-pill-swatch",
				`ui-pill-swatch--${size}`,
				noTint && "ui-pill-swatch--no-tint",
				className,
			)}
			style={style}
			title={title ?? label}
			aria-label={label}
		/>
	);
}
