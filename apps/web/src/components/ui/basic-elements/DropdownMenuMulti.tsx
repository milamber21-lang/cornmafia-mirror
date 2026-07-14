//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/DropdownMenuMulti.tsx                                        ////
//// Language: TSX                                                                                                ////
//// Multi-select dropdown menu with local open-state handling                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export type MultiOption = { value: string; label: string; disabled?: boolean };

type Props = {
	options: MultiOption[];
	value?: string[];
	onChange?: (values: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
	ariaLabel?: string;
};

export default function DropdownMenuMulti({
	options,
	value = [],
	onChange,
	placeholder = "Select…",
	disabled,
	size = "md",
	className,
	ariaLabel,
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

	const label =
		value.length === 0
			? placeholder
			: options
					.filter((o) => value.includes(o.value))
					.map((o) => o.label)
					.join(", ");

	function toggle(v: string) {
		const set = new Set(value);
		if (set.has(v)) set.delete(v);
		else set.add(v);
		onChange?.(Array.from(set));
	}

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
				<span className={cn(value.length === 0 && "ui-dropdown__placeholder")}>
					{label}
				</span>
				<span aria-hidden className="ui-dropdown__chevron">
					▾
				</span>
			</button>

			{open && (
				<div
					ref={popRef}
					role="listbox"
					aria-multiselectable
					id={uid}
					className="ui-dropdown__menu"
				>
					{options.map((opt) => {
						const active = value.includes(opt.value);
						return (
							<label
								key={opt.value}
								className={cn(
									"ui-dropdown__option ui-dropdown__check-row",
									active && "ui-dropdown__option--multi-active",
									opt.disabled && "ui-dropdown__option--disabled",
								)}
							>
								<input
									type="checkbox"
									checked={active}
									disabled={opt.disabled}
									onChange={() => toggle(opt.value)}
								/>
								<span>{opt.label}</span>
							</label>
						);
					})}
				</div>
			)}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
