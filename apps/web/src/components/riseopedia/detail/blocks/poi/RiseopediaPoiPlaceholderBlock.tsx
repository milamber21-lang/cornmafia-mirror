//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiPlaceholderBlock.tsx                                 ////
//// Language: TSX                                                                                              ////
//// Renders explicit Activity and Landmark availability notices without inventing unsupported POI facts.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaEmptyState from "@/components/riseopedia/ui/RiseopediaEmptyState";
import type { RiseopediaBodyBlock } from "@/lib/data/riseopedia-entity-detail";

export type RiseopediaPoiPlaceholderBlockProps = {
	block: RiseopediaBodyBlock;
};

type PoiPlaceholderCopy = {
	title: string;
	message: string;
};

function placeholderCopy(bodyBlockCode: string): PoiPlaceholderCopy {
	switch (bodyBlockCode) {
		case "poi_activity_placeholder":
			return {
				title: "Activity details are not available yet.",
				message:
					"This point is identified as an activity location. Structured activity rules, rewards, and progression data are not yet available in the canonical public model.",
			};
		case "poi_landmark_placeholder":
			return {
				title: "Landmark details are not available yet.",
				message:
					"This point is identified as a landmark. Curated history, gameplay purpose, and additional landmark facts will appear here once they are supported by canonical data.",
			};
		default:
			return {
				title: "Additional information is not available yet.",
				message:
					"This detail block is ready for future canonical data, but no supported public facts are available to render yet.",
			};
	}
}

export default function RiseopediaPoiPlaceholderBlock({
	block,
}: RiseopediaPoiPlaceholderBlockProps): JSX.Element {
	const copy = placeholderCopy(block.bodyBlockCode);

	return (
		<section className="riseopedia-body-section riseopedia-poi-placeholder">
			<h2 className="riseopedia-section-title">{block.bodyBlockLabel}</h2>
			<RiseopediaEmptyState title={copy.title} message={copy.message} />
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
