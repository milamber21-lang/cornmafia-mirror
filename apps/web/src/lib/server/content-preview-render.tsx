//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/content-preview-render.tsx                                                    ////
//// Language: TSX                                                                                               ////
//// Renders the real content renderer to static HTML for unsaved authoring previews.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import React from "react";
import { prerender } from "react-dom/static";

import ContentRenderer from "@/components/renderers/content/ContentRenderer";
import type { ContentRenderModel } from "@/components/renderers/content/types";

export async function renderContentPreviewHtml(
	model: ContentRenderModel,
): Promise<string> {
	const { prelude } = await prerender(
		<div className="content-live-preview__rendered-page">
			<ContentRenderer model={model} />
		</div>,
	);

	return new Response(prelude).text();
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
