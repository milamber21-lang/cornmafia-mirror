//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaMediaFrame.tsx                                      ////
//// Language: TSX                                                                                               ////
//// Public Riseopedia hero media frame built on the shared channel-safe entity visual renderer.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import type { RiseopediaMediaRef } from "@/lib/data/riseopedia-assets";

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";

export type RiseopediaMediaFrameProps = {
	media: RiseopediaMediaRef | null;
	fallbackMedia?: RiseopediaMediaRef | null;
	alt: string;
	placeholderLabel: string;
	loading?: "eager" | "lazy";
	rarityCode?: string | null;
};

export default function RiseopediaMediaFrame({
	media,
	fallbackMedia = null,
	alt,
	placeholderLabel,
	loading = "eager",
	rarityCode,
}: RiseopediaMediaFrameProps): JSX.Element {
	return (
		<RiseopediaEntityVisual
			as="figure"
			className="riseopedia-media-frame"
			media={media}
			fallbackMedia={fallbackMedia}
			alt={alt}
			placeholderLabel={placeholderLabel}
			size="hero"
			loading={loading}
			rarityCode={rarityCode}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
