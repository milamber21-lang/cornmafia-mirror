//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/recipe/RiseopediaRecipeTreeBlock.tsx                                    ////
//// Language: TSX                                                                                            ////
//// Configurable recipe-tree body block wrapper for Riseopedia-family recipe detail pages.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaEntityRecipeTree from "@/components/riseopedia/detail/RiseopediaEntityRecipeTree";
import type {
	RiseopediaDetailElement,
	RiseopediaEntityMediaRef,
	RiseopediaRecipeOutput,
	RiseopediaRecipeRequirement,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaRecipeTreeBlockProps = {
	requirements: RiseopediaRecipeRequirement[];
	outputs: RiseopediaRecipeOutput[];
	recipeStageElements: RiseopediaDetailElement[];
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	showHeading?: boolean;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

export default function RiseopediaRecipeTreeBlock({
	requirements,
	outputs,
	recipeStageElements,
	mediaByFileId,
	showHeading,
	wikiCode,
	releaseFilters,
}: RiseopediaRecipeTreeBlockProps): JSX.Element | null {
	return (
		<RiseopediaEntityRecipeTree
			requirements={requirements}
			outputs={outputs}
			recipeStageElements={recipeStageElements}
			mediaByFileId={mediaByFileId}
			showHeading={showHeading}
			wikiCode={wikiCode}
			releaseFilters={releaseFilters}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
