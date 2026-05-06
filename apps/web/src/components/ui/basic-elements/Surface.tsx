//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Surface.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Shared surface, icon-well, and status-pill primitives for semantic visual composition.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SurfaceTone =
	| "default"
	| "muted"
	| "subtle"
	| "success"
	| "warning"
	| "danger"
	| "info";

export type SurfaceDensity = "compact" | "comfortable" | "spacious";

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
	tone?: SurfaceTone;
	density?: SurfaceDensity;
	interactive?: boolean;
};

type SurfacePanelProps = HTMLAttributes<HTMLElement> & {
	tone?: SurfaceTone;
	density?: SurfaceDensity;
};

type IconWellProps = HTMLAttributes<HTMLSpanElement> & {
	tone?: SurfaceTone;
	size?: "sm" | "md" | "lg";
	children: ReactNode;
};

type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
	tone?: SurfaceTone;
	size?: "xs" | "sm" | "md";
	children: ReactNode;
};

function getToneClass(baseClass: string, tone: SurfaceTone): string {
	return `${baseClass}--${tone}`;
}

function getDensityClass(baseClass: string, density: SurfaceDensity): string {
	return `${baseClass}--${density}`;
}

export function SurfaceCard({
	tone = "default",
	density = "comfortable",
	interactive = false,
	className,
	...rest
}: SurfaceCardProps): React.JSX.Element {
	return (
		<div
			{...rest}
			className={cn(
				"surface-card",
				getToneClass("surface-card", tone),
				getDensityClass("surface-card", density),
				interactive && "surface-card--interactive",
				className,
			)}
		/>
	);
}

export function SurfacePanel({
	tone = "default",
	density = "comfortable",
	className,
	...rest
}: SurfacePanelProps): React.JSX.Element {
	return (
		<section
			{...rest}
			className={cn(
				"surface-panel",
				getToneClass("surface-panel", tone),
				getDensityClass("surface-panel", density),
				className,
			)}
		/>
	);
}

export function IconWell({
	tone = "default",
	size = "md",
	className,
	children,
	...rest
}: IconWellProps): React.JSX.Element {
	return (
		<span
			{...rest}
			className={cn(
				"surface-icon-well",
				getToneClass("surface-icon-well", tone),
				`surface-icon-well--${size}`,
				className,
			)}
		>
			{children}
		</span>
	);
}

export function StatusPill({
	tone = "default",
	size = "sm",
	className,
	children,
	...rest
}: StatusPillProps): React.JSX.Element {
	return (
		<span
			{...rest}
			className={cn(
				"surface-status-pill",
				getToneClass("surface-status-pill", tone),
				`surface-status-pill--${size}`,
				className,
			)}
		>
			{children}
		</span>
	);
}
