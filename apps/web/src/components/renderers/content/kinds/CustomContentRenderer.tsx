//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/CustomContentRenderer.tsx                              ////
//// Language: TSX                                                                                                ////
//// Custom content renderer shell for fallback custom layouts.                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderModel } from "../types";

type CustomContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

export default function CustomContentRenderer({
	model,
	debug = false,
}: CustomContentRendererProps): JSX.Element {
	return <ContentRenderShell model={model} debug={debug} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
