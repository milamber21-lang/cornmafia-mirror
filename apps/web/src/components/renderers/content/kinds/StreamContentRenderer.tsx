//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/StreamContentRenderer.tsx                              ////
//// Language: TSX                                                                                                ////
//// Stream content renderer shell for future stream-focused layouts.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type StreamContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function StreamContentRenderer({
	model,
	debug = false,
}: StreamContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
