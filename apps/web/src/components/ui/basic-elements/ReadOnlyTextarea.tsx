//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyTextarea.tsx                                          ////
//// Language: TSX                                                                                                 ////
//// Exports read-only textarea primitive                                                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { CSSProperties } from "react";

import { cn } from "../../../lib/cn";

type ReadOnlyTextareaStyle = CSSProperties & {
	"--ui-readonly-textarea-rows"?: number;
};

type Props = {
	value?: string | number | null | undefined;
	placeholder?: string;
	rows?: number;
	className?: string;
	"aria-label"?: string;
};

export default function ReadOnlyTextarea({
	value,
	placeholder,
	rows = 4,
	className,
	...rest
}: Props) {
	const text =
		value === null || value === undefined || value === ""
			? (placeholder ?? "—")
			: String(value);
	const runtimeStyle: ReadOnlyTextareaStyle = {
		"--ui-readonly-textarea-rows": rows,
	};

	return (
		<div
			role="textbox"
			aria-readonly="true"
			tabIndex={0}
			className={cn("ui-readonly-textarea", className)}
			style={runtimeStyle}
			{...rest}
		>
			{text}
		</div>
	);
}
