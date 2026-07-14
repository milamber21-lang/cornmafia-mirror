//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiPublicBenchAssetBlock.tsx          ////
//// Language: TSX                                                                                               ////
//// Renders the exact canonical bench asset and variant provided by a public bench POI.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import RiseopediaOverviewTable from "@/components/riseopedia/detail/RiseopediaOverviewTable";
import type {
	RiseopediaBodyBlock,
	RiseopediaPoiPublicBenchLinkRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaPoiPublicBenchAssetBlockProps = {
	block: RiseopediaBodyBlock;
	rows: RiseopediaPoiPublicBenchLinkRow[];
	selectedEntityVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function benchRow(args: {
	rows: RiseopediaPoiPublicBenchLinkRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiPublicBenchLinkRow | null {
	const rows = args.rows.filter((row) => row.linkKindCode === "bench_asset");
	return (
		rows.find((row) => row.entityVariantId === args.selectedEntityVariantId) ??
		rows.find((row) => row.entityVariantId === null) ??
		rows[0] ??
		null
	);
}

function titleCaseCode(value: string): string {
	return value
		.split("_")
		.filter(Boolean)
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

export default function RiseopediaPoiPublicBenchAssetBlock({
	block,
	rows,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiPublicBenchAssetBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const row = benchRow({ rows, selectedEntityVariantId });
	if (!row) {
		return null;
	}

	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.targetEntityTypeCode,
		entitySlug: row.targetEntitySlug,
		targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
		wikiCode,
		releaseFilters,
	});
	const linkedAsset = href ? (
		<Link className="riseopedia-poi-linked-entity__link" href={href}>
			{row.targetEntityName}
		</Link>
	) : (
		<span>{row.targetEntityName}</span>
	);

	return (
		<RiseopediaOverviewTable
			headingId={`riseopedia-poi-overview-${block.displayProfileBodyBlockId}`}
			title={block.bodyBlockLabel}
			rows={[
				{ key: "bench", label: "Bench", value: linkedAsset },
				{
					key: "variant",
					label: "Variant",
					value: row.targetEntityVariantLabel,
				},
				{
					key: "family",
					label: "Family",
					value: row.benchFamilyCode ? titleCaseCode(row.benchFamilyCode) : null,
				},
				{
					key: "tier",
					label: "Provided tier",
					value: row.providedTier === null ? null : `Tier ${row.providedTier}`,
				},
			]}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
