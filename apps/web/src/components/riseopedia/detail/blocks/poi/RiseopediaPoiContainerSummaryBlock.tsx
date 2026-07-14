//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiContainerSummaryBlock.tsx          ////
//// Language: TSX                                                                                               ////
//// Renders compact container respawn, capacity, and roll behavior facts.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaOverviewTable from "@/components/riseopedia/detail/RiseopediaOverviewTable";
import type {
	RiseopediaBodyBlock,
	RiseopediaPoiContainerLootRow,
} from "@/lib/data/riseopedia-entity-detail";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaPoiContainerSummaryBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaPoiContainerLootRow[];
	selectedEntityVariantId: string | null;
};

function rowsForVariant(args: {
	rows: RiseopediaPoiContainerLootRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiContainerLootRow[] {
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

function durationLabel(seconds: number | null): string | null {
	if (seconds === null) {
		return null;
	}
	if (seconds >= 3600 && seconds % 3600 === 0) {
		return `${formatRiseopediaNumber(seconds / 3600)} hr`;
	}
	if (seconds >= 60 && seconds % 60 === 0) {
		return `${formatRiseopediaNumber(seconds / 60)} min`;
	}
	return `${formatRiseopediaNumber(seconds)} sec`;
}

function titleCaseCode(value: string): string {
	return value
		.split("_")
		.filter(Boolean)
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function rangeLabel(
	minimum: number | null,
	maximum: number | null,
): string | null {
	if (minimum === null && maximum === null) {
		return null;
	}
	if (minimum !== null && maximum !== null) {
		return minimum === maximum
			? formatRiseopediaNumber(minimum)
			: `${formatRiseopediaNumber(minimum)}–${formatRiseopediaNumber(maximum)}`;
	}
	return minimum !== null
		? `${formatRiseopediaNumber(minimum)}+`
		: `Up to ${formatRiseopediaNumber(maximum ?? 0)}`;
}

export default function RiseopediaPoiContainerSummaryBlock({
	block,
	rows,
	selectedEntityVariantId,
}: RiseopediaPoiContainerSummaryBlockProps): JSX.Element | null {
	const visibleRows = rowsForVariant({ rows, selectedEntityVariantId });
	const row = visibleRows[0];
	if (!row) {
		return null;
	}

	return (
		<RiseopediaOverviewTable
			headingId={`riseopedia-poi-overview-${block.displayProfileBodyBlockId}`}
			title={block.bodyBlockLabel}
			rows={[
				{
					key: "mode",
					label: "Loot mode",
					value: titleCaseCode(row.itemModeCode),
				},
				{
					key: "rolls",
					label: "Items per refresh",
					value: rangeLabel(row.minSpawnedItems, row.maxSpawnedItems),
				},
				{
					key: "respawn",
					label: "Refresh rate",
					value: durationLabel(row.respawnTimeSeconds),
				},
				{
					key: "slots",
					label: "Inventory slots",
					value: row.maxSlots,
				},
				{
					key: "placements",
					label: "Known placements",
					value: row.placementCount,
				},
				{
					key: "repeatable",
					label: "Repeated item rolls",
					value: visibleRows.some((item) => item.repeatableFlag) ? "Possible" : "No",
				},
			]}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
