//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/CalendarContentRenderer.tsx                            ////
//// Language: TSX                                                                                                ////
//// Calendar content renderer shell for future schedule-focused layouts.                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type CalendarContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function CalendarContentRenderer({
	model,
	debug = false,
}: CalendarContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
