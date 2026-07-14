//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiContainerContentsBlock.tsx         ////
//// Language: TSX                                                                                               ////
//// Renders canonical container contents, per-roll chance, and repeatable roll evidence.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";
import { Package } from "lucide-react";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import { RiseopediaDetailTable } from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type {
	RiseopediaEntityMediaRef,
	RiseopediaPoiContainerLootRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaPoiContainerContentsBlockProps = {
	rows: RiseopediaPoiContainerLootRow[];
	selectedEntityVariantId: string | null;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
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

function itemName(row: RiseopediaPoiContainerLootRow): string {
	return row.itemEntityName ?? row.itemSourceValueText ?? "Unresolved item";
}

function chanceLabel(row: RiseopediaPoiContainerLootRow): string {
	if (row.availabilityCode === "guaranteed") {
		return "Guaranteed";
	}

	return row.chancePercent === null
		? "—"
		: `${formatRiseopediaNumber(row.chancePercent)}%`;
}

function rollLabel(row: RiseopediaPoiContainerLootRow): string {
	const occurrenceCount = row.sourceOccurrenceCount ?? 1;
	if (row.repeatableFlag && occurrenceCount > 1) {
		return `${formatRiseopediaNumber(occurrenceCount)} weighted slots · repeatable`;
	}
	if (row.repeatableFlag) {
		return "Can roll multiple times";
	}
	if (occurrenceCount > 1) {
		return `${formatRiseopediaNumber(occurrenceCount)} guaranteed copies`;
	}

	return "Single entry";
}

function quantityLabel(row: RiseopediaPoiContainerLootRow): string | null {
	if (row.minQuantity === null && row.maxQuantity === null) {
		return null;
	}
	if (row.minQuantity !== null && row.maxQuantity !== null) {
		return row.minQuantity === row.maxQuantity
			? `Quantity ${formatRiseopediaNumber(row.minQuantity)}`
			: `Quantity ${formatRiseopediaNumber(row.minQuantity)}–${formatRiseopediaNumber(row.maxQuantity)}`;
	}

	return row.minQuantity !== null
		? `Quantity ${formatRiseopediaNumber(row.minQuantity)}+`
		: `Up to ${formatRiseopediaNumber(row.maxQuantity ?? 0)}`;
}

export default function RiseopediaPoiContainerContentsBlock({
	rows,
	selectedEntityVariantId,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiContainerContentsBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const visibleRows = rowsForVariant({ rows, selectedEntityVariantId }).sort(
		(left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}
			return itemName(left).localeCompare(itemName(right));
		},
	);
	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<RiseopediaDetailTable
			className="riseopedia-poi-container-loot"
			variant="standard"
		>
			<ul className="riseopedia-poi-container-loot__list">
				<li className="riseopedia-poi-container-loot__header" aria-hidden>
					<span>Item</span>
					<span>Chance</span>
					<span>Rolls</span>
				</li>
				{visibleRows.map((row) => {
					const href = buildRiseopediaEntityHref({
						entityTypeCode: row.itemEntityTypeCode,
						entitySlug: row.itemEntitySlug,
						targetEntityVariantKey: variantKeyFor(row.itemEntityVariantId),
						wikiCode,
						releaseFilters,
					});
					const media = row.itemIconMediaFileId
						? (mediaByFileId.get(row.itemIconMediaFileId) ?? null)
						: null;
					const iconHref =
						media?.url ?? buildRiseopediaMediaHref(row.itemIconMediaFileId, wikiCode);
					const classification = [
						row.itemEntityVariantLabel,
						row.itemEntityClassName,
						quantityLabel(row),
					]
						.filter((value): value is string => Boolean(value))
						.join(" · ");

					return (
						<li
							className="riseopedia-poi-container-loot__row"
							data-resolution-status={row.resolutionStatusCode}
							key={row.lootTableEntryId}
						>
							<div className="riseopedia-poi-container-loot__item">
								<span className="riseopedia-poi-container-loot__icon" aria-hidden>
									{iconHref ? (
										<RiseopediaEntityVisual
											className="riseopedia-entity-visual--embedded"
											media={{
												url: iconHref,
												width: media?.width ?? null,
												height: media?.height ?? null,
											}}
											alt=""
											placeholderLabel="Container item"
											size="inline"
											decorative
										/>
									) : (
										<Package />
									)}
								</span>
								<div className="riseopedia-poi-container-loot__copy">
									{href ? (
										<Link className="riseopedia-poi-container-loot__link" href={href}>
											{itemName(row)}
										</Link>
									) : (
										<span className="riseopedia-poi-container-loot__name">
											{itemName(row)}
										</span>
									)}
									{classification ? (
										<span className="riseopedia-poi-container-loot__meta">
											{classification}
										</span>
									) : null}
								</div>
							</div>
							<span className="riseopedia-poi-container-loot__chance">
								{chanceLabel(row)}
							</span>
							<span className="riseopedia-poi-container-loot__rolls">
								{rollLabel(row)}
							</span>
						</li>
					);
				})}
			</ul>
		</RiseopediaDetailTable>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
