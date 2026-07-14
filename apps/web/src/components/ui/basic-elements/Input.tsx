//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Input.tsx                                                     ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Input primitive                                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

type UISize = "sm" | "md" | "lg";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
	size?: UISize;
};

export default function Input({ className, size = "md", ...rest }: Props) {
	return (
		<input {...rest} className={cn("ui-input", `ui-input--${size}`, className)} />
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
