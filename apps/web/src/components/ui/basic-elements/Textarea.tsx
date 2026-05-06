//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Textarea.tsx                                                  ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Textarea primitive                                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

type UISize = "sm" | "md" | "lg";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	uiSize?: UISize;
};

export default function Textarea({
	className,
	uiSize = "md",
	rows = 5,
	...rest
}: Props) {
	return (
		<textarea
			{...rest}
			rows={rows}
			className={cn("ui-textarea", `ui-textarea--${uiSize}`, className)}
		/>
	);
}
