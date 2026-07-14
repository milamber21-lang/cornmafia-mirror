//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Label.tsx                                                     ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Label primitive                                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { LabelHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export default function Label({
	className,
	...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
	return <label {...rest} className={cn("ui-label", className)} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
