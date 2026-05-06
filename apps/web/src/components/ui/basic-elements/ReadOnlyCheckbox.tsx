//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/ReadOnlyCheckbox.tsx                                          ////
//// Language: TSX                                                                                                 ////
//// Exports the shared read-only Checkbox primitive                                                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { ComponentProps } from "react";

import { cn } from "../../../lib/cn";

type Size = "sm" | "md" | "lg";

type ReadOnlyCheckboxProps = {
	checked?: boolean;
	label?: string;
	size?: Size;
} & Omit<ComponentProps<"input">, "type" | "size" | "checked" | "onChange">;

export default function ReadOnlyCheckbox({
	checked,
	label,
	size = "md",
	className,
	...rest
}: ReadOnlyCheckboxProps) {
	return (
		<label
			className={cn(
				"ui-readonly-checkbox",
				`ui-readonly-checkbox--${size}`,
				className,
			)}
			aria-readonly="true"
		>
			<input
				{...rest}
				type="checkbox"
				checked={!!checked}
				readOnly
				disabled
				className={cn(
					"form-checkbox-input ui-readonly-checkbox__input",
					`ui-readonly-checkbox__input--${size}`,
				)}
				tabIndex={-1}
			/>
			{label ? <span className="ui-readonly-checkbox__label">{label}</span> : null}
		</label>
	);
}
