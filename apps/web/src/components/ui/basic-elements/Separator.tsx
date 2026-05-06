//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Separator.tsx                                                 ////
//// Language: TSX                                                                                                 ////
//// Exports visual separator component                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
	orientation?: "horizontal" | "vertical";
	decorative?: boolean;
}

export default function Separator({
	orientation = "horizontal",
	decorative = true,
	className,
	role,
	...rest
}: SeparatorProps) {
	const isVertical = orientation === "vertical";

	return (
		<div
			role={decorative ? "none" : (role ?? "separator")}
			aria-orientation={isVertical ? "vertical" : "horizontal"}
			className={cn(
				"ui-separator",
				isVertical ? "ui-separator--vertical" : "ui-separator--horizontal",
				className,
			)}
			{...rest}
		/>
	);
}
