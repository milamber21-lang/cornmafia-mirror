//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiResourceSummaryBlock.tsx           ////
//// Language: TSX                                                                                               ////
//// Renders compact gathering-field spawner and startup-roll facts.                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaOverviewTable from "@/components/riseopedia/detail/RiseopediaOverviewTable";
import type {
	RiseopediaBodyBlock,
	RiseopediaPoiResourceYieldRow,
} from "@/lib/data/riseopedia-entity-detail";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaPoiResourceSummaryBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaPoiResourceYieldRow[];
	selectedEntityVariantId: string | null;
};

function rowsForVariant(args: {
	rows: RiseopediaPoiResourceYieldRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiResourceYieldRow[] {
	if (!args.selectedEntityVariantId) {
		return args.rows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	return exactRows.length > 0
		? exactRows
		: args.rows.filter((row) => row.entityVariantId === null);
}

function startupLabel(row: RiseopediaPoiResourceYieldRow): string | null {
	const minimum = row.initialStartupTriesMin;
	const maximum = row.initialStartupTriesMax;
	if (minimum === null && maximum === null) {
		return null;
	}
	if (minimum !== null && maximum !== null) {
		return minimum === maximum
			? formatRiseopediaNumber(minimum)
			: `${formatRiseopediaNumber(minimum)}–${formatRiseopediaNumber(maximum)}`;
	}
	return formatRiseopediaNumber(minimum ?? maximum ?? 0);
}

export default function RiseopediaPoiResourceSummaryBlock({
	block,
	rows,
	selectedEntityVariantId,
}: RiseopediaPoiResourceSummaryBlockProps): JSX.Element | null {
	const visibleRows = rowsForVariant({ rows, selectedEntityVariantId });
	const row = visibleRows[0];
	if (!row) {
		return null;
	}

	const uniqueItems = new Set(
		visibleRows.map(
			(item) =>
				item.itemEntityId ?? item.itemSourceValueText ?? item.lootTableEntryId,
		),
	).size;

	return (
		<RiseopediaOverviewTable
			headingId={`riseopedia-poi-overview-${block.displayProfileBodyBlockId}`}
			title={block.bodyBlockLabel}
			rows={[
				{ key: "resources", label: "Resource types", value: uniqueItems },
				{ key: "spawners", label: "Spawners", value: row.spawnerCount },
				{
					key: "startup",
					label: "Startup attempts",
					value: startupLabel(row),
				},
			]}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
