//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentRenderer.tsx                                          ////
//// Language: TSX                                                                                                ////
//// Main full-content renderer dispatcher for current and future renderer-code families.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaEntityPreviewProvider from "@/components/riseopedia/context/RiseopediaEntityPreviewProvider";
import AppContentRenderer from "./kinds/AppContentRenderer";
import CalendarContentRenderer from "./kinds/CalendarContentRenderer";
import CustomContentRenderer from "./kinds/CustomContentRenderer";
import EventContentRenderer from "./kinds/EventContentRenderer";
import MapContentRenderer from "./kinds/MapContentRenderer";
import PageContentRenderer from "./kinds/PageContentRenderer";
import StreamContentRenderer from "./kinds/StreamContentRenderer";
import ToolContentRenderer from "./kinds/ToolContentRenderer";
import YoutubeContentRenderer from "./kinds/YoutubeContentRenderer";
import type { ContentRenderModel } from "./types";

type ContentRendererProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

function renderContentByCode(
	model: ContentRenderModel,
	debug: boolean,
): JSX.Element {
	const rendererCode = model.doc.rendererCode.trim().toLowerCase();

	switch (rendererCode) {
		case "map":
			return <MapContentRenderer model={model} debug={debug} />;
		case "tool":
			return <ToolContentRenderer model={model} debug={debug} />;
		case "app":
			return <AppContentRenderer model={model} debug={debug} />;
		case "event":
			return <EventContentRenderer model={model} debug={debug} />;
		case "youtube":
			return <YoutubeContentRenderer model={model} debug={debug} />;
		case "stream":
			return <StreamContentRenderer model={model} debug={debug} />;
		case "calendar":
			return <CalendarContentRenderer model={model} debug={debug} />;
		case "custom":
			return <CustomContentRenderer model={model} debug={debug} />;
		case "page":
		default:
			return <PageContentRenderer model={model} debug={debug} />;
	}
}

export default function ContentRenderer({
	model,
	debug = false,
}: ContentRendererProps): JSX.Element {
	const renderedContent = renderContentByCode(model, debug);

	if (model.surfaceScope !== "public") {
		return renderedContent;
	}

	return (
		<RiseopediaEntityPreviewProvider wikiCode="riseopedia">
			{renderedContent}
		</RiseopediaEntityPreviewProvider>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
