//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/IconVisual.tsx                                                              ////
//// Language: TSX                                                                                                 ////
//// Global Riseopedia-inspired visual shell for application icons rendered by IconRender.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { HTMLAttributes } from "react";

import IconRender, { type IconRenderProps } from "@/components/ui/IconRender";
import { cn } from "@/lib/cn";

export type IconVisualSize = "inline" | "compact" | "card" | "large";

export type IconVisualProps = Omit<
	HTMLAttributes<HTMLSpanElement>,
	"children" | "title"
> &
	Omit<IconRenderProps, "className" | "size"> & {
		size?: IconVisualSize;
		iconClassName?: string;
	};

export default function IconVisual({
	size = "card",
	iconClassName,
	className,
	iconKey,
	iconColor,
	relationHint,
	fallback,
	title,
	mediaRouteScope,
	...rest
}: IconVisualProps): React.JSX.Element {
	return (
		<span
			{...rest}
			className={cn("app-icon-visual", `app-icon-visual--${size}`, className)}
		>
			<IconRender
				iconKey={iconKey}
				iconColor={iconColor}
				relationHint={relationHint}
				fallback={fallback}
				title={title}
				mediaRouteScope={mediaRouteScope}
				size={64}
				className={cn("app-icon-visual__icon", iconClassName)}
			/>
		</span>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
