//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiPublicBenchRecipesBlock.tsx        ////
//// Language: TSX                                                                                               ////
//// Groups tier-eligible public-bench Recipes by classification with standardized icons.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import {
	RiseopediaDetailTable,
	RiseopediaHierarchyTreeGroup,
} from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import IconRender from "@/components/ui/IconRender";
import type { RiseopediaPoiPublicBenchLinkRow } from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaPoiPublicBenchRecipesBlockProps = {
	rows: RiseopediaPoiPublicBenchLinkRow[];
	selectedEntityVariantId: string | null;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type RecipeClassificationGroup = {
	key: string;
	label: string;
	rows: RiseopediaPoiPublicBenchLinkRow[];
};

function rowsForVariant(args: {
	rows: RiseopediaPoiPublicBenchLinkRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiPublicBenchLinkRow[] {
	const recipeRows = args.rows.filter((row) => row.linkKindCode === "recipe");
	if (!args.selectedEntityVariantId) {
		return recipeRows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = recipeRows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	return exactRows.length > 0
		? exactRows
		: recipeRows.filter((row) => row.entityVariantId === null);
}

function tierLabel(row: RiseopediaPoiPublicBenchLinkRow): string | null {
	if (row.requiredTier === null && row.providedTier === null) {
		return null;
	}

	if (row.requiredTier !== null && row.providedTier !== null) {
		return row.exactTierFlag
			? `Tier ${row.requiredTier} recipe`
			: `Tier ${row.requiredTier} recipe · Tier ${row.providedTier} bench`;
	}

	return row.requiredTier !== null
		? `Tier ${row.requiredTier} recipe`
		: `Tier ${row.providedTier} bench`;
}

function classificationParts(row: RiseopediaPoiPublicBenchLinkRow): string[] {
	const values = [
		row.targetEntityClassName,
		row.targetEntityCategoryName,
		row.targetEntitySubcategoryName,
	].filter((value): value is string => Boolean(value?.trim()));
	const seen = new Set<string>();

	return values.filter((value) => {
		const normalized = value.trim().toLocaleLowerCase();
		if (seen.has(normalized)) {
			return false;
		}

		seen.add(normalized);
		return true;
	});
}

function classificationLabel(row: RiseopediaPoiPublicBenchLinkRow): string {
	const parts = classificationParts(row);
	return parts.length > 0
		? parts.join(" / ")
		: (row.targetClassificationLabel ?? "Recipes");
}

function classificationKey(row: RiseopediaPoiPublicBenchLinkRow): string {
	return [
		row.targetEntityClassCode ?? "xna",
		row.targetEntityCategoryCode ?? "xna",
		row.targetEntitySubcategoryCode ?? "xna",
	].join(":");
}

function groupedRows(
	rows: RiseopediaPoiPublicBenchLinkRow[],
): RecipeClassificationGroup[] {
	const groups = new Map<string, RecipeClassificationGroup>();

	for (const row of rows) {
		const key = classificationKey(row);
		const existing = groups.get(key);
		if (existing) {
			existing.rows.push(row);
			continue;
		}

		groups.set(key, {
			key,
			label: classificationLabel(row),
			rows: [row],
		});
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			rows: [...group.rows].sort((left, right) =>
				left.targetEntityName.localeCompare(right.targetEntityName),
			),
		}))
		.sort((left, right) => left.label.localeCompare(right.label));
}

export default function RiseopediaPoiPublicBenchRecipesBlock({
	rows,
	selectedEntityVariantId,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiPublicBenchRecipesBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const visibleRows = rowsForVariant({ rows, selectedEntityVariantId });
	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<RiseopediaDetailTable
			className="riseopedia-poi-grouped-list"
			variant="standard"
		>
			<div className="riseopedia-poi-grouped-list__groups">
				{groupedRows(visibleRows).map((group) => (
					<RiseopediaHierarchyTreeGroup
						className="riseopedia-poi-grouped-list__group"
						key={group.key}
						label={group.label}
						meta={group.rows.length}
					>
						<ul className="riseopedia-poi-grouped-list__rows">
							{group.rows.map((row) => {
								const href = buildRiseopediaEntityHref({
									entityTypeCode: row.targetEntityTypeCode,
									entitySlug: row.targetEntitySlug,
									targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
									wikiCode,
									releaseFilters,
								});
								const iconHref = buildRiseopediaMediaHref(
									row.targetIconMediaFileId,
									wikiCode,
								);

								return (
									<li
										className="riseopedia-poi-grouped-list__row"
										data-resolution-status={row.resolutionStatusCode}
										key={row.entityRelationshipId}
									>
										<span
											className="riseopedia-poi-numbered-list__icon"
											aria-hidden="true"
										>
											<IconRender
												className="riseopedia-poi-list-icon"
												fallback={{ lucideName: "CookingPot" }}
												iconKey={
													iconHref
														? {
																label: row.targetEntityName,
																source: "media",
																iconMedia: iconHref,
															}
														: null
												}
												size={24}
											/>
										</span>
										<div className="riseopedia-poi-numbered-list__copy">
											{href ? (
												<Link className="riseopedia-poi-numbered-list__link" href={href}>
													{row.targetEntityName}
												</Link>
											) : (
												<span className="riseopedia-poi-numbered-list__name">
													{row.targetEntityName}
												</span>
											)}
											{tierLabel(row) ? (
												<span className="riseopedia-poi-numbered-list__meta">
													{tierLabel(row)}
												</span>
											) : null}
										</div>
									</li>
								);
							})}
						</ul>
					</RiseopediaHierarchyTreeGroup>
				))}
			</div>
		</RiseopediaDetailTable>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
