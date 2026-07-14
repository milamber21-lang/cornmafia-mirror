//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaEntityBodyContent.tsx                                  ////
//// Language: TSX                                                                                             ////
//// Preserves a DB-flag-driven fallback body renderer when configured body blocks are unavailable.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaProfilePropertyStackBlock from "@/components/riseopedia/detail/blocks/profile/RiseopediaProfilePropertyStackBlock";
import RiseopediaProfileProseBlock from "@/components/riseopedia/detail/blocks/profile/RiseopediaProfileProseBlock";
import type { RiseopediaDetailElement } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityBodyContentProps = {
	rows: RiseopediaDetailElement[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

export default function RiseopediaEntityBodyContent({
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaEntityBodyContentProps): JSX.Element | null {
	const proseRows = rows.filter((row) => row.featured);
	const detailRows = rows.filter((row) => !row.featured);

	if (proseRows.length === 0 && detailRows.length === 0) {
		return null;
	}

	return (
		<div className="riseopedia-body-content">
			<RiseopediaProfileProseBlock
				rows={proseRows}
				wikiCode={wikiCode}
				releaseFilters={releaseFilters}
			/>
			<RiseopediaProfilePropertyStackBlock
				rows={detailRows}
				wikiCode={wikiCode}
				releaseFilters={releaseFilters}
			/>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
