//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/EventContentRenderer.tsx                               ////
//// Language: TSX                                                                                                ////
//// Event content renderer shell for future event-focused layouts.                                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type EventContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function EventContentRenderer({
	model,
	debug = false,
}: EventContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
