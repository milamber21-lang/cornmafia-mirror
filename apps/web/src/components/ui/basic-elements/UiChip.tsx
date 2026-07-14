//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/UiChip.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Exports chip button wrapper                                                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { ReactNode } from "react";

import { cn } from "../../../lib/cn";
import { Button } from "./Button";

export type UiChipProps = {
	label: string;
	leftIcon?: ReactNode;
	onClick?: () => void;
	onRemove?: () => void;
	draggable?: boolean;
	dashed?: boolean;
	disabled?: boolean;
	title?: string;
	className?: string;
	rightSlot?: ReactNode;
	chipClassName?: string;
};

export default function UiChip({
	label,
	leftIcon,
	onClick,
	onRemove,
	draggable,
	dashed,
	disabled,
	title,
	className,
	rightSlot,
	chipClassName,
}: UiChipProps) {
	return (
		<div className={cn("ui-chip", className)} title={title}>
			<Button
				size="sm"
				variant="secondary"
				pill
				onClick={onClick}
				disabled={disabled}
				className={cn(
					"ui-chip__button",
					dashed && "ui-chip__button--dashed",
					draggable && "ui-chip__button--draggable",
					!draggable && "ui-chip__button--clickable",
					chipClassName,
				)}
			>
				{leftIcon ? <span className="ui-chip__icon">{leftIcon}</span> : null}
				<span className="ui-chip__label">{label}</span>
				{rightSlot ? <span className="ui-chip__slot">{rightSlot}</span> : null}
			</Button>
			{onRemove ? (
				<Button
					size="sm"
					variant="quiet"
					pill
					onClick={onRemove}
					disabled={disabled}
					aria-label={`Remove ${label}`}
					title={`Remove ${label}`}
					className="ui-chip__remove"
				>
					×
				</Button>
			) : null}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
