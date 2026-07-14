//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaEmptyState.tsx                                         ////
//// Language: TSX                                                                                             ////
//// Renders one shared compact icon-and-message state for Riseopedia/Mafiosopedia detail blocks.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { CircleOff } from "lucide-react";

export type RiseopediaEmptyStateProps = {
	message?: string;
	title?: string;
};

function resolveMessage({ message, title }: RiseopediaEmptyStateProps): string {
	const preferredMessage = title?.trim() || message?.trim();
	return preferredMessage || "No data available.";
}

export default function RiseopediaEmptyState(
	props: RiseopediaEmptyStateProps,
): JSX.Element {
	const message = resolveMessage(props);

	return (
		<div className="riseopedia-empty-state" role="status">
			<CircleOff
				aria-hidden="true"
				className="riseopedia-empty-state__icon"
				strokeWidth={1.5}
			/>
			<p className="riseopedia-empty-state__label">{message}</p>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
