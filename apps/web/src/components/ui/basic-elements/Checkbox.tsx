//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Checkbox.tsx                                                  ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Checkbox primitive                                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "neutral" | "accent" | "ghost" | "green";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
	size?: Size;
	variant?: Variant;
	label?: string;
	block?: boolean;
	pill?: boolean;
};

export default function Checkbox({
	className,
	size = "md",
	variant = "neutral",
	label,
	block,
	pill,
	checked,
	defaultChecked,
	...rest
}: Props) {
	return (
		<label
			className={cn(
				"ui-checkbox",
				`ui-checkbox--${size}`,
				`ui-checkbox--${variant}`,
				pill && "ui-checkbox--pill",
				block && "ui-checkbox--block",
				className,
			)}
		>
			<input
				{...rest}
				type="checkbox"
				checked={checked}
				defaultChecked={defaultChecked}
				className={cn(
					"form-checkbox-input ui-checkbox__input",
					`ui-checkbox__input--${size}`,
					(variant === "accent" || variant === "green") &&
						"form-checkbox-input--contrast",
				)}
			/>
			{label ? <span className="ui-checkbox__label">{label}</span> : null}
		</label>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
