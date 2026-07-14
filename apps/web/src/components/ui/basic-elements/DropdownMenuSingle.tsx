//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/DropdownMenuSingle.tsx                                       ////
//// Language: TSX                                                                                                ////
//// Single-select dropdown menu with local open-state handling and optional clear action                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export type SingleOption = { value: string; label: string; disabled?: boolean };

type Props = {
	options: SingleOption[];
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
	ariaLabel?: string;
	allowClear?: boolean;
	clearLabel?: string;
};

export default function DropdownMenuSingle({
	options,
	value,
	onChange,
	placeholder = "Select...",
	disabled,
	size = "md",
	className,
	ariaLabel,
	allowClear = false,
	clearLabel = "Clear selection",
}: Props) {
	const [open, setOpen] = useState(false);
	const btnRef = useRef<HTMLButtonElement | null>(null);
	const popRef = useRef<HTMLDivElement | null>(null);
	const uid = useId();

	useEffect(() => {
		function onDocClick(e: MouseEvent) {
			if (!open) return;
			const t = e.target as Node;
			if (btnRef.current?.contains(t)) return;
			if (popRef.current?.contains(t)) return;
			setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [open]);

	const selected = options.find((o) => o.value === value);
	const hasValue = typeof value === "string" && value.trim().length > 0;

	return (
		<div className={cn("ui-dropdown", className)}>
			<button
				ref={btnRef}
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={uid}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={() => setOpen((v) => !v)}
				className={cn("ui-dropdown__button", `ui-dropdown__button--${size}`)}
			>
				<span
					className={cn(
						"ui-dropdown__label",
						!selected && "ui-dropdown__placeholder",
					)}
				>
					{selected?.label ?? placeholder}
				</span>
				<span aria-hidden className="ui-dropdown__chevron">
					v
				</span>
			</button>

			{open && (
				<div ref={popRef} role="listbox" id={uid} className="ui-dropdown__menu">
					{allowClear ? (
						<button
							type="button"
							disabled={!hasValue}
							onClick={() => {
								onChange?.("");
								setOpen(false);
							}}
							className="ui-dropdown__clear"
						>
							{clearLabel}
						</button>
					) : null}

					{options.map((opt) => {
						const active = value === opt.value;
						return (
							<button
								key={opt.value}
								type="button"
								role="option"
								aria-selected={active}
								disabled={opt.disabled}
								onClick={() => {
									onChange?.(opt.value);
									setOpen(false);
								}}
								className={cn(
									"ui-dropdown__option",
									active && "ui-dropdown__option--active",
									opt.disabled && "ui-dropdown__option--disabled",
								)}
							>
								{opt.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
