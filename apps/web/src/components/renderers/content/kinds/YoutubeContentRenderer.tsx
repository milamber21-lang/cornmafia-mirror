//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/kinds/YoutubeContentRenderer.tsx                             ////
//// Language: TSX                                                                                                ////
//// Uses the shared destination shell while promoting Main YouTube embeds to a full-width featured module.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentRenderShell from "../ContentRenderShell";
import type { ContentRenderField, ContentRenderModel } from "../types";

type YoutubeContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

function isYoutubeField(field: ContentRenderField): boolean {
	return field.fieldTypeCode === "youtube_url";
}

export default function YoutubeContentRenderer({
	model,
	debug = false,
}: YoutubeContentRendererProps): JSX.Element {
	const mainVideoFields = model.fieldsByDestination.main.filter(isYoutubeField);
	const mainBodyFields = model.fieldsByDestination.main.filter(
		(field) => !isYoutubeField(field),
	);

	return (
		<ContentRenderShell
			model={model}
			debug={debug}
			featuredFields={mainVideoFields}
			mainFields={mainBodyFields}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
