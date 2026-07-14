//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/DateTimeInput.tsx                                            ////
//// Language: TSX                                                                                               ////
//// Shared native date and datetime input that normalizes values for form state                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { InputHTMLAttributes } from "react";

import Input from "./Input";

export type DateTimeInputMode = "date" | "datetime";
type UISize = "sm" | "md" | "lg";

type Props = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "value" | "onChange" | "min" | "max" | "size"
> & {
	mode?: DateTimeInputMode;
	value?: string | null;
	onChange: (value: string) => void;
	minValue?: string | null;
	maxValue?: string | null;
	size?: UISize;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(date: Date): boolean {
	return !Number.isNaN(date.getTime());
}

export function toDateInputValue(value: string | null | undefined): string {
	if (!value) {
		return "";
	}

	const normalized = value.trim();
	if (DATE_ONLY_PATTERN.test(normalized)) {
		return normalized;
	}

	const date = new Date(normalized);
	return isValidDate(date) ? date.toISOString().slice(0, 10) : "";
}

export function fromDateInputValue(value: string): string {
	const normalized = value.trim();
	return DATE_ONLY_PATTERN.test(normalized) ? normalized : "";
}

export function toDateTimeLocalValue(value: string | null | undefined): string {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	if (!isValidDate(date)) {
		return "";
	}

	const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
	const localDate = new Date(date.getTime() - timezoneOffsetMs);
	return localDate.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string): string {
	const normalized = value.trim();
	if (!normalized) {
		return "";
	}

	const date = new Date(normalized);
	return isValidDate(date) ? date.toISOString() : "";
}

export default function DateTimeInput({
	mode = "datetime",
	value = "",
	onChange,
	minValue = null,
	maxValue = null,
	step = 60,
	size = "md",
	...rest
}: Props) {
	const inputValue =
		mode === "date" ? toDateInputValue(value) : toDateTimeLocalValue(value);
	const min =
		mode === "date" ? toDateInputValue(minValue) : toDateTimeLocalValue(minValue);
	const max =
		mode === "date" ? toDateInputValue(maxValue) : toDateTimeLocalValue(maxValue);

	return (
		<Input
			{...rest}
			type={mode === "date" ? "date" : "datetime-local"}
			value={inputValue}
			min={min}
			max={max}
			step={mode === "date" ? undefined : step}
			size={size}
			onChange={(event) => {
				const nextValue =
					mode === "date"
						? fromDateInputValue(event.target.value)
						: fromDateTimeLocalValue(event.target.value);
				onChange(nextValue);
			}}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
