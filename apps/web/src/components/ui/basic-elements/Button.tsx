//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Button.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Exports shared button and button-link primitives                                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../../lib/cn";

type Size = "xs" | "sm" | "md" | "lg";
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

function sizeClass(size: Size): string {
	return `ui-button--${size}`;
}

function variantClass(variant: Variant): string {
	return `ui-button--${variant}`;
}

function buttonClassName(args: {
	size: Size;
	variant: Variant;
	pill?: boolean;
	block?: boolean;
	className?: string;
}): string {
	return cn(
		"ui-button",
		sizeClass(args.size),
		variantClass(args.variant),
		args.pill && "ui-button--pill",
		args.block && "ui-button--block",
		args.className,
	);
}

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
			className={buttonClassName({ size, variant, pill, block, className })}
			{...rest}
		>
			{leftIcon && (
				<span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>
			)}
			{loading ? "Loading…" : children}
			{rightIcon && (
				<span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>
			)}
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
	Omit<ComponentProps<typeof Link>, "href" | "className"> & {
		href: string;
		className?: string;
	}) {
	return (
		<Link
			href={href}
			className={cn(
				"ui-btn",
				buttonClassName({ size, variant, pill, block, className }),
			)}
			{...rest}
		>
			{leftIcon && (
				<span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>
			)}
			{loading ? "Loading…" : children}
			{rightIcon && (
				<span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>
			)}
		</Link>
	);
}
