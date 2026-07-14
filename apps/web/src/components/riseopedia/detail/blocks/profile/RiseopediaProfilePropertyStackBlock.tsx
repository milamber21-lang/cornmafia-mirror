//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/profile/RiseopediaProfilePropertyStackBlock.tsx                         ////
//// Language: TSX                                                                                             ////
//// Renders configured profile properties through the shared definition-table body family.                    ////
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
import { formatRiseopediaNumericText } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaProfilePropertyStackBlockProps = {
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

function linkedValue(
	row: RiseopediaDetailElement,
	wikiCode: OpediaWikiCode | undefined,
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined,
	variantKeyFor: (entityVariantId: string | null | undefined) => string | null,
): JSX.Element | string {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: row.linkedEntityTypeCode,
		entitySlug: row.linkedEntitySlug,
		targetEntityVariantKey: variantKeyFor(row.linkedEntityVariantId),
		wikiCode,
		releaseFilters,
	});

	const displayValue = formatRiseopediaNumericText(row.displayValue);
	if (!href) {
		return displayValue;
	}

	return (
		<Link className="riseopedia-recipe-tree__asset-link" href={href}>
			{displayValue}
		</Link>
	);
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

export default function RiseopediaProfilePropertyStackBlock({
	rows,
	wikiCode,
	releaseFilters,
}: RiseopediaProfilePropertyStackBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	if (rows.length === 0) {
		return null;
	}

	return (
		<div className="riseopedia-property-stack">
			{orderedRows(rows).map((row) => (
				<article className="riseopedia-property-card" key={profileElementKey(row)}>
					<h3 className="riseopedia-property-card__label">{row.displayLabel}</h3>
					<p className="riseopedia-property-card__value">
						{linkedValue(row, wikiCode, releaseFilters, variantKeyFor)}
					</p>
				</article>
			))}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
