//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiResourceSiteBlock.tsx              ////
//// Language: TSX                                                                                               ////
//// Renders canonical resource-site yields from the release-aware POI loot-table read model.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";
import { Pickaxe } from "lucide-react";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";
import { RiseopediaDetailTable } from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";
import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type {
	RiseopediaEntityMediaRef,
	RiseopediaPoiResourceYieldRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaPoiResourceSiteBlockProps = {
	rows: RiseopediaPoiResourceYieldRow[];
	selectedEntityVariantId: string | null;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function titleCaseCode(value: string): string {
	return value
		.split("_")
		.filter((part) => part.length > 0)
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function rowsForSelectedVariant(args: {
	rows: RiseopediaPoiResourceYieldRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiResourceYieldRow[] {
	if (!args.selectedEntityVariantId) {
		return args.rows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	if (exactRows.length > 0) {
		return exactRows;
	}

	return args.rows.filter((row) => row.entityVariantId === null);
}

function orderedRows(
	rows: RiseopediaPoiResourceYieldRow[],
): RiseopediaPoiResourceYieldRow[] {
	return [...rows].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		const leftName = left.itemEntityName ?? left.itemSourceValueText ?? "";
		const rightName = right.itemEntityName ?? right.itemSourceValueText ?? "";
		const nameCompare = leftName.localeCompare(rightName);
		if (nameCompare !== 0) {
			return nameCompare;
		}

		return left.lootTableEntryId.localeCompare(right.lootTableEntryId);
	});
}

function quantityLabel(row: RiseopediaPoiResourceYieldRow): string {
	if (row.minQuantity === null && row.maxQuantity === null) {
		return "—";
	}

	if (row.minQuantity === null) {
		return `Up to ${formatRiseopediaNumber(row.maxQuantity ?? 0)}`;
	}

	if (row.maxQuantity === null) {
		return `${formatRiseopediaNumber(row.minQuantity)}+`;
	}

	if (row.minQuantity === row.maxQuantity) {
		return formatRiseopediaNumber(row.minQuantity);
	}

	return `${formatRiseopediaNumber(row.minQuantity)}–${formatRiseopediaNumber(row.maxQuantity)}`;
}

function evidenceLabel(row: RiseopediaPoiResourceYieldRow): string | null {
	const values: string[] = [];
	if (row.spawnerCount !== null) {
		values.push(`${formatRiseopediaNumber(row.spawnerCount)} spawners`);
	}
	if (
		row.initialStartupTriesMin !== null ||
		row.initialStartupTriesMax !== null
	) {
		const minimum = row.initialStartupTriesMin;
		const maximum = row.initialStartupTriesMax;
		if (minimum !== null && maximum !== null && minimum !== maximum) {
			values.push(
				`${formatRiseopediaNumber(minimum)}–${formatRiseopediaNumber(maximum)} startup tries`,
			);
		} else {
			values.push(
				`${formatRiseopediaNumber(minimum ?? maximum ?? 0)} startup tries`,
			);
		}
	}
	if (row.chanceValue !== null) {
		values.push(`Chance: ${formatRiseopediaNumber(row.chanceValue)}`);
	}
	if (row.weightValue !== null) {
		values.push(`Weight: ${formatRiseopediaNumber(row.weightValue)}`);
	}
	if (row.availabilityCode !== "guaranteed") {
		values.push(titleCaseCode(row.availabilityCode));
	}

	return values.length > 0 ? values.join(" · ") : null;
}

function itemDisplayName(row: RiseopediaPoiResourceYieldRow): string {
	return row.itemEntityName ?? row.itemSourceValueText ?? "Unresolved resource";
}

function RiseopediaPoiResourceIcon({
	row,
	mediaByFileId,
	wikiCode,
}: {
	row: RiseopediaPoiResourceYieldRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const media = row.itemIconMediaFileId
		? (mediaByFileId.get(row.itemIconMediaFileId) ?? null)
		: null;
	const iconHref =
		media?.url ?? buildRiseopediaMediaHref(row.itemIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-poi-vendor-stock__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-poi-vendor-stock__visual riseopedia-entity-visual--embedded"
					media={{
						url: iconHref,
						width: media?.width ?? null,
						height: media?.height ?? null,
					}}
					alt=""
					placeholderLabel="Resource"
					size="inline"
					decorative
				/>
			) : (
				<Pickaxe className="riseopedia-poi-vendor-stock__icon-fallback" />
			)}
		</span>
	);
}

export default function RiseopediaPoiResourceSiteBlock({
	rows,
	selectedEntityVariantId,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiResourceSiteBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const visibleRows = orderedRows(
		rowsForSelectedVariant({ rows, selectedEntityVariantId }),
	);
	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-poi-resource-site riseopedia-poi-vendor-stock">
			<RiseopediaDetailTable variant="standard">
				<ul className="riseopedia-poi-vendor-stock__list">
					<li className="riseopedia-poi-vendor-stock__header" aria-hidden>
						<span className="riseopedia-poi-vendor-stock__header-item">Resource</span>
						<span className="riseopedia-poi-vendor-stock__header-price">Yield</span>
						<span className="riseopedia-poi-vendor-stock__header-stock">
							Evidence
						</span>
					</li>
					{visibleRows.map((row) => {
						const href = buildRiseopediaEntityHref({
							entityTypeCode: row.itemEntityTypeCode,
							entitySlug: row.itemEntitySlug,
							targetEntityVariantKey: variantKeyFor(row.itemEntityVariantId),
							wikiCode,
							releaseFilters,
						});
						const classification = [
							row.itemEntityVariantLabel,
							row.itemEntityClassName,
						]
							.filter((value): value is string => value !== null && value !== "")
							.join(" · ");
						const evidence = evidenceLabel(row);

						return (
							<li
								className="riseopedia-poi-vendor-stock__row"
								data-resolution-status={row.resolutionStatusCode}
								key={row.lootTableEntryId}
							>
								<div className="riseopedia-poi-vendor-stock__item">
									<RiseopediaPoiResourceIcon
										row={row}
										mediaByFileId={mediaByFileId}
										wikiCode={wikiCode}
									/>
									<div className="riseopedia-poi-vendor-stock__copy">
										{href ? (
											<Link className="riseopedia-poi-vendor-stock__link" href={href}>
												{itemDisplayName(row)}
											</Link>
										) : (
											<span className="riseopedia-poi-vendor-stock__name">
												{itemDisplayName(row)}
											</span>
										)}
										{classification ? (
											<span className="riseopedia-poi-vendor-stock__meta">
												{classification}
											</span>
										) : null}
									</div>
								</div>
								<span className="riseopedia-poi-vendor-stock__price">
									{quantityLabel(row)}
								</span>
								<div className="riseopedia-poi-vendor-stock__facts">
									{evidence ? (
										<span className="riseopedia-poi-vendor-stock__availability">
											{evidence}
										</span>
									) : (
										<span className="riseopedia-poi-vendor-stock__quantity">—</span>
									)}
									{row.resolutionStatusCode !== "resolved" ? (
										<span className="riseopedia-poi-vendor-stock__status">
											{titleCaseCode(row.resolutionStatusCode)}
										</span>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
