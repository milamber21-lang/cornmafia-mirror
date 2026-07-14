//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiFactSummaryBlock.tsx               ////
//// Language: TSX                                                                                               ////
//// Renders compact Holocache rarity/XP and Aero Trails gate/checkpoint facts.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaOverviewTable from "@/components/riseopedia/detail/RiseopediaOverviewTable";
import type {
	RiseopediaBodyBlock,
	RiseopediaPoiSummaryFactRow,
} from "@/lib/data/riseopedia-entity-detail";

export type RiseopediaPoiFactSummaryBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaPoiSummaryFactRow[];
};

export default function RiseopediaPoiFactSummaryBlock({
	block,
	rows,
}: RiseopediaPoiFactSummaryBlockProps): JSX.Element | null {
	const row = rows[0];
	if (!row) {
		return null;
	}

	if (row.summaryKindCode === "holocache") {
		return (
			<RiseopediaOverviewTable
				headingId={`riseopedia-poi-overview-${block.displayProfileBodyBlockId}`}
				title={block.bodyBlockLabel}
				rarityCode={row.rarityCode}
				rows={[
					{ key: "rarity", label: "Rarity", value: row.rarityName },
					{ key: "xp", label: "XP", value: row.xpAwarded },
				]}
			/>
		);
	}

	if (row.summaryKindCode === "aero_trail") {
		return (
			<RiseopediaOverviewTable
				headingId={`riseopedia-poi-overview-${block.displayProfileBodyBlockId}`}
				title={block.bodyBlockLabel}
				rows={[
					{ key: "gates", label: "Total gates", value: row.routePointCount },
					{ key: "checkpoints", label: "Checkpoints", value: row.checkpointCount },
					{ key: "start", label: "Start gates", value: row.startCount },
					{ key: "finish", label: "Finish gates", value: row.finishCount },
				]}
			/>
		);
	}

	return null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
