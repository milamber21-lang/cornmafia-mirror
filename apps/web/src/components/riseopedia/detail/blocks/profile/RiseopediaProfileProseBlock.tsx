//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/profile/RiseopediaProfileProseBlock.tsx                                  ////
//// Language: TSX                                                                                             ////
//// Renders body-block-assigned profile prose without React-owned semantic section bucketing.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";

import type { RiseopediaDetailElement } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaProfileProseBlockProps = {
	rows: RiseopediaDetailElement[];
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function profileElementKey(row: RiseopediaDetailElement): string {
	return [
		row.displayProfileElementId ?? "fallback",
		row.entityPropertyValueId ?? "value",
		row.entityVariantId ?? "entity",
		row.sourceCode,
	].join(":");
}

function orderedRows(
	rows: RiseopediaDetailElement[],
): RiseopediaDetailElement[] {
	return [...rows].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		const labelCompare = left.displayLabel.localeCompare(right.displayLabel);
		if (labelCompare !== 0) {
			return labelCompare;
		}

		return left.displayValue.localeCompare(right.displayValue);
	});
}

function paragraphValues(value: string): string[] {
	return value
		.replace(/\r\n?/g, "\n")
		.split(/\n[\t ]*\n+/)
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph.length > 0);
}

export function hasRenderableRiseopediaProfileProseRows(
	rows: RiseopediaDetailElement[],
): boolean {
	return rows.some((row) => paragraphValues(row.displayValue).length > 0);
}

function proseParagraphs(args: {
	row: RiseopediaDetailElement;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null;
}): JSX.Element[] {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: args.row.linkedEntityTypeCode,
		entitySlug: args.row.linkedEntitySlug,
		targetEntityVariantKey: args.variantKeyFor(args.row.linkedEntityVariantId),
		wikiCode: args.wikiCode,
		releaseFilters: args.releaseFilters,
	});
	const rowKey = profileElementKey(args.row);

	return paragraphValues(args.row.displayValue).map((paragraph, index) => (
		<p className="riseopedia-prose-section__text" key={`${rowKey}:${index}`}>
			{href ? (
				<Link className="riseopedia-recipe-tree__asset-link" href={href}>
					{paragraph}
				</Link>
			) : (
				paragraph
			)}
		</p>
	));
}

export default function RiseopediaProfileProseBlock({
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaProfileProseBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	if (!hasRenderableRiseopediaProfileProseRows(rows)) {
		return null;
	}

	const renderableRows = orderedRows(rows).filter(
		(row) => paragraphValues(row.displayValue).length > 0,
	);

	return (
		<div className="riseopedia-profile-prose">
			{renderableRows.map((row) => (
				<div className="riseopedia-prose-section" key={profileElementKey(row)}>
					{proseParagraphs({ row, wikiCode, releaseFilters, variantKeyFor })}
				</div>
			))}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
