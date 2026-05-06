//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyInput.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Exports read-only input primitive                                                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import * as React from "react";

import { cn } from "../../../lib/cn";

type Props = {
	value?: string | number | null | undefined;
	placeholder?: string;
	selectOnClick?: boolean;
	className?: string;
	"aria-label"?: string;
};

export default function ReadOnlyInput({
	value,
	placeholder,
	selectOnClick,
	className,
	...rest
}: Props) {
	const ref = React.useRef<HTMLDivElement | null>(null);

	function handleClick() {
		if (!selectOnClick || !ref.current) {
			return;
		}

		const range = document.createRange();
		range.selectNodeContents(ref.current);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	const text =
		value === null || value === undefined || value === ""
			? (placeholder ?? "—")
			: String(value);

	return (
		<div
			ref={ref}
			role="textbox"
			aria-readonly="true"
			tabIndex={0}
			onClick={handleClick}
			className={cn("ui-readonly-input", className)}
			{...rest}
		>
			<span className="ui-readonly-input__value">{text}</span>
		</div>
	);
}
